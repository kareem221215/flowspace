'use client'

import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { CodeViewer } from '@/components/files/CodeViewer'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, formatFileSize, getInitials, cn } from '@/lib/utils'
import { uploadFile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import type { SharedFile } from '@/types'
import {
  Upload, File, FileCode, FileImage, FileArchive, Download, Trash2,
  Grid, List, Search, Loader2, X, FolderUp, ChevronDown, ChevronRight,
  Folder, FolderOpen, Send, Hash, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

function getFileIcon(file: { type: string; is_code: boolean }) {
  if (file.is_code) return FileCode
  if (file.type.startsWith('image/')) return FileImage
  if (file.type.includes('zip') || file.type.includes('archive')) return FileArchive
  return File
}

function getFileColor(file: { type: string; is_code: boolean }) {
  if (file.is_code) return 'text-violet-500 bg-violet-50 dark:bg-violet-900/20'
  if (file.type.startsWith('image/')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
  if (file.type.includes('zip')) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
  return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
}

// Build display items: ungrouped files + folder groups
type FolderGroup = { type: 'folder'; folderId: string; folderName: string; files: SharedFile[] }
type FileItem = { type: 'file'; file: SharedFile }
type DisplayItem = FolderGroup | FileItem

function buildDisplayItems(files: SharedFile[]): DisplayItem[] {
  const items: DisplayItem[] = []
  const folderMap = new Map<string, FolderGroup>()

  for (const f of files) {
    if (f.folder_id && f.folder_name) {
      if (!folderMap.has(f.folder_id)) {
        const group: FolderGroup = { type: 'folder', folderId: f.folder_id, folderName: f.folder_name, files: [] }
        folderMap.set(f.folder_id, group)
        items.push(group)
      }
      folderMap.get(f.folder_id)!.files.push(f)
    } else {
      items.push({ type: 'file', file: f })
    }
  }

  return items
}

export default function FilesPage() {
  const { files, deleteFile, deleteFiles, addFile, currentUser, team, channels, sendMessage, setActiveChannel } = useAppStore()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadLabel, setUploadLabel] = useState('')
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Multi-select
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set())
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)

  // Send modal
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendChannelId, setSendChannelId] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const uploadMenuRef = useRef<HTMLDivElement>(null)

  const allUsers = currentUser ? [currentUser, ...team] : team

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
        setShowUploadMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = files.filter((f) =>
    search ? f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.folder_name?.toLowerCase().includes(search.toLowerCase()) : true,
  )

  const displayItems = buildDisplayItems(filtered)
  const selectedFile = files.find((f) => f.id === selected)

  function toggleFolder(folderId: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.has(folderId) ? next.delete(folderId) : next.add(folderId)
      return next
    })
  }

  function toggleMultiSelect(id: string) {
    setMultiSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleFolderSelect(group: FolderGroup) {
    const allIds = group.files.map((f) => f.id)
    const allSelected = allIds.every((id) => multiSelected.has(id))
    setMultiSelected((prev) => {
      const next = new Set(prev)
      allIds.forEach((id) => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  function clearSelection() {
    setMultiSelected(new Set())
    setIsMultiSelecting(false)
  }

  async function handleDeleteSelected() {
    if (!multiSelected.size) return
    await deleteFiles(Array.from(multiSelected))
    toast.success(`${multiSelected.size} item${multiSelected.size > 1 ? 's' : ''} deleted`)
    clearSelection()
    if (selected && multiSelected.has(selected)) setSelected(null)
  }

  async function handleSendSelected() {
    const channelId = sendChannelId || channels.find((c) => !c.is_dm)?.id
    if (!channelId) { toast.error('No channel selected'); return }

    const selectedFileObjs = files.filter((f) => multiSelected.has(f.id))
    setActiveChannel(channelId)

    for (const f of selectedFileObjs) {
      await sendMessage(`📎 [${f.name}](${f.url})`)
    }

    toast.success(`Sent ${selectedFileObjs.length} file${selectedFileObjs.length > 1 ? 's' : ''}`)
    setShowSendModal(false)
    clearSelection()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return
    setUploading(true)
    setUploadProgress(10)
    setUploadLabel(file.name)
    try {
      const supabase = createClient()
      setUploadProgress(30)
      const saved = await uploadFile(supabase, file, currentUser.id)
      setUploadProgress(90)
      if (saved) { addFile(saved); toast.success(`${file.name} uploaded`); setSelected(saved.id) }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false); setUploadProgress(0); setUploadLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(e.target.files ?? [])
    if (!fileList.length || !currentUser) return

    const folderId = crypto.randomUUID()
    const folderName = (fileList[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split('/')[0] ?? 'Folder'

    setUploading(true)
    const supabase = createClient()

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      setUploadLabel(`${i + 1}/${fileList.length} — ${file.name}`)
      setUploadProgress(Math.round(((i + 1) / fileList.length) * 90))
      try {
        const saved = await uploadFile(supabase, file, currentUser.id, undefined, { folderId, folderName, relativePath })
        if (saved) addFile(saved)
      } catch {
        toast.error(`Failed: ${file.name}`)
      }
    }

    setExpandedFolders((prev) => new Set([...prev, folderId]))
    toast.success(`Folder "${folderName}" uploaded (${fileList.length} files)`)
    setUploading(false); setUploadProgress(0); setUploadLabel('')
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (selected === id) setSelected(null)
    const storagePath = files.find((f) => f.id === id)?.storage_path
    await deleteFile(id, storagePath)
    toast.success('File deleted')
  }

  async function handleDownload(file: SharedFile) {
    if (!file.url || file.url === '#') { toast.error('No download URL'); return }
    const a = document.createElement('a')
    a.href = file.url; a.download = file.name; a.target = '_blank'; a.click()
  }

  const publicChannels = channels.filter((c) => !c.is_dm)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Files"
        subtitle={`${files.length} files`}
        actions={
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <input
              ref={folderInputRef} type="file" className="hidden" onChange={handleFolderSelect}
              // @ts-expect-error webkitdirectory is non-standard
              webkitdirectory="" multiple
            />
            <div className="relative" ref={uploadMenuRef}>
              <div className="flex items-stretch">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary rounded-r-none disabled:opacity-60 border-r border-primary-700"
                >
                  {uploading ? <><Loader2 size={15} className="animate-spin" />{uploadLabel || 'Uploading…'}</> : <><Upload size={15} />Upload</>}
                </button>
                <button onClick={() => setShowUploadMenu((v) => !v)} disabled={uploading} className="btn-primary rounded-l-none px-2 disabled:opacity-60">
                  <ChevronDown size={14} />
                </button>
              </div>
              {showUploadMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                  <button onClick={() => { setShowUploadMenu(false); fileInputRef.current?.click() }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Upload size={14} /> Upload File
                  </button>
                  <button onClick={() => { setShowUploadMenu(false); folderInputRef.current?.click() }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <FolderUp size={14} /> Upload Folder
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      {uploading && (
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-8 py-1.5 text-sm" />
            </div>
            <button
              onClick={() => { setIsMultiSelecting((v) => !v); setMultiSelected(new Set()) }}
              className={cn('btn-secondary text-xs', isMultiSelecting && 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 text-primary-700 dark:text-primary-300')}
            >
              <Check size={13} /> Select
            </button>
            <div className="ml-auto flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button onClick={() => setView('grid')} className={cn('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600')}>
                <Grid size={14} />
              </button>
              <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600')}>
                <List size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <File size={48} className="mb-3 opacity-20" />
                <p className="font-medium text-slate-500 dark:text-slate-400">No files yet</p>
                <p className="text-sm mt-1">Upload a file or folder to get started</p>
                <button onClick={() => fileInputRef.current?.click()} className="btn-primary mt-4">
                  <Upload size={15} /> Upload File
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="space-y-6">
                {displayItems.map((item) => {
                  if (item.type === 'folder') {
                    const isExpanded = expandedFolders.has(item.folderId)
                    const allSel = item.files.every((f) => multiSelected.has(f.id))
                    const someSel = item.files.some((f) => multiSelected.has(f.id))
                    return (
                      <div key={item.folderId}>
                        {/* Folder header */}
                        <div
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors mb-2',
                            someSel && 'bg-primary-50 dark:bg-primary-900/20',
                          )}
                          onClick={() => toggleFolder(item.folderId)}
                        >
                          {isMultiSelecting && (
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleFolderSelect(item) }}
                              className={cn(
                                'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                allSel ? 'bg-primary-600 border-primary-600' : someSel ? 'bg-primary-200 border-primary-400' : 'border-slate-300 dark:border-slate-600',
                              )}
                            >
                              {(allSel || someSel) && <Check size={10} className="text-white" />}
                            </div>
                          )}
                          {isExpanded ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                          {isExpanded ? <FolderOpen size={18} className="text-amber-500 shrink-0" /> : <Folder size={18} className="text-amber-500 shrink-0" />}
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.folderName}</span>
                          <span className="text-xs text-slate-400 ml-1">{item.files.length} files · {formatFileSize(item.files.reduce((s, f) => s + f.size, 0))}</span>
                        </div>

                        {isExpanded && (
                          <div className="ml-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {item.files.map((file) => (
                              <FileCard
                                key={file.id} file={file}
                                isSelected={selected === file.id}
                                isMultiSelected={multiSelected.has(file.id)}
                                isMultiSelecting={isMultiSelecting}
                                onSelect={() => !isMultiSelecting && setSelected(selected === file.id ? null : file.id)}
                                onMultiSelect={() => toggleMultiSelect(file.id)}
                                onDelete={() => handleDelete(file.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div key={item.file.id} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 -mt-2">
                      <FileCard
                        file={item.file}
                        isSelected={selected === item.file.id}
                        isMultiSelected={multiSelected.has(item.file.id)}
                        isMultiSelecting={isMultiSelecting}
                        onSelect={() => !isMultiSelecting && setSelected(selected === item.file.id ? null : item.file.id)}
                        onMultiSelect={() => toggleMultiSelect(item.file.id)}
                        onDelete={() => handleDelete(item.file.id)}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List view */
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {isMultiSelecting && <th className="w-10 px-4 py-3" />}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Size</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Uploaded by</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {displayItems.map((item) => {
                      if (item.type === 'folder') {
                        const isExpanded = expandedFolders.has(item.folderId)
                        const allSel = item.files.every((f) => multiSelected.has(f.id))
                        const someSel = item.files.some((f) => multiSelected.has(f.id))
                        return (
                          <>
                            <tr key={item.folderId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => toggleFolder(item.folderId)}>
                              {isMultiSelecting && (
                                <td className="px-4 py-3">
                                  <div onClick={(e) => { e.stopPropagation(); toggleFolderSelect(item) }}
                                    className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', allSel ? 'bg-primary-600 border-primary-600' : someSel ? 'bg-primary-200 border-primary-400' : 'border-slate-300 dark:border-slate-600')}
                                  >
                                    {(allSel || someSel) && <Check size={10} className="text-white" />}
                                  </div>
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                                  {isExpanded ? <FolderOpen size={16} className="text-amber-500" /> : <Folder size={16} className="text-amber-500" />}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.folderName}</span>
                                  <span className="text-xs text-slate-400">{item.files.length} files</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{formatFileSize(item.files.reduce((s, f) => s + f.size, 0))}</td>
                              <td colSpan={3} />
                            </tr>
                            {isExpanded && item.files.map((file) => {
                              const Icon = getFileIcon(file)
                              const colorClass = getFileColor(file)
                              const uploader = allUsers.find((u) => u.id === file.uploaded_by)
                              return (
                                <tr key={file.id} onClick={() => !isMultiSelecting && setSelected(selected === file.id ? null : file.id)}
                                  className={cn('hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group', selected === file.id && 'bg-primary-50 dark:bg-primary-900/20')}
                                >
                                  {isMultiSelecting && (
                                    <td className="px-4 py-2.5 pl-8">
                                      <div onClick={(e) => { e.stopPropagation(); toggleMultiSelect(file.id) }}
                                        className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', multiSelected.has(file.id) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-600')}
                                      >
                                        {multiSelected.has(file.id) && <Check size={10} className="text-white" />}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-4 py-2.5 pl-10">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClass}`}><Icon size={12} /></div>
                                      <span className="text-slate-700 dark:text-slate-300 text-xs">{file.relative_path ?? file.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-500 text-xs">{formatFileSize(file.size)}</td>
                                  <td className="px-4 py-2.5">{uploader && <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">{getInitials(uploader.name)}</div><span className="text-slate-600 dark:text-slate-400 text-xs">{uploader.name}</span></div>}</td>
                                  <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(file.created_at)}</td>
                                  <td className="px-4 py-2.5"><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id) }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button></td>
                                </tr>
                              )
                            })}
                          </>
                        )
                      }

                      const file = item.file
                      const Icon = getFileIcon(file)
                      const colorClass = getFileColor(file)
                      const uploader = allUsers.find((u) => u.id === file.uploaded_by)
                      return (
                        <tr key={file.id} onClick={() => !isMultiSelecting && setSelected(selected === file.id ? null : file.id)}
                          className={cn('hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group', selected === file.id && 'bg-primary-50 dark:bg-primary-900/20')}
                        >
                          {isMultiSelecting && (
                            <td className="px-4 py-3">
                              <div onClick={(e) => { e.stopPropagation(); toggleMultiSelect(file.id) }}
                                className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', multiSelected.has(file.id) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-600')}
                              >
                                {multiSelected.has(file.id) && <Check size={10} className="text-white" />}
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass}`}><Icon size={14} /></div><span className="font-medium text-slate-800 dark:text-slate-200">{file.name}</span></div></td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</td>
                          <td className="px-4 py-3">{uploader && <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">{getInitials(uploader.name)}</div><span className="text-slate-600 dark:text-slate-400 text-xs">{uploader.name}</span></div>}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatDate(file.created_at)}</td>
                          <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); handleDelete(file.id) }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* File preview panel */}
        {selectedFile && !isMultiSelecting && (
          <div className="w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex-1">{selectedFile.name}</p>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 shrink-0"><X size={14} /></button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
              {[
                { label: 'Size', value: formatFileSize(selectedFile.size) },
                { label: 'Type', value: selectedFile.language?.toUpperCase() ?? selectedFile.type.split('/')[1]?.toUpperCase() ?? 'File' },
                { label: 'Uploaded', value: formatDate(selectedFile.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => handleDownload(selectedFile)} className="btn-secondary flex-1 text-xs"><Download size={13} /> Download</button>
              <button onClick={() => handleDelete(selectedFile.id)} className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors font-medium flex items-center gap-1.5"><Trash2 size={13} /> Delete</button>
            </div>
            {selectedFile.is_code && selectedFile.content ? (
              <div className="flex-1 overflow-auto p-3"><CodeViewer content={selectedFile.content} language={selectedFile.language ?? 'text'} fileName={selectedFile.name} maxHeight={600} /></div>
            ) : selectedFile.type.startsWith('image/') && selectedFile.url !== '#' ? (
              <div className="flex-1 overflow-auto p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedFile.url} alt={selectedFile.name} className="w-full rounded-lg border border-slate-100 dark:border-slate-800" />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center"><File size={40} className="mx-auto mb-2 opacity-20" /><p className="text-xs">No preview available</p></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-select action bar */}
      {isMultiSelecting && multiSelected.size > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {multiSelected.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button onClick={clearSelection} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={() => { setSendChannelId(publicChannels[0]?.id ?? ''); setShowSendModal(true) }}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Send size={14} /> Send to…
            </button>
            <button onClick={handleDeleteSelected} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors font-medium flex items-center gap-1.5">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Send {multiSelected.size} file{multiSelected.size > 1 ? 's' : ''} to…</h2>
              <button onClick={() => setShowSendModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Channel</p>
              <div className="space-y-1">
                {publicChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSendChannelId(ch.id)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors text-sm',
                      sendChannelId === ch.id
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                    )}
                  >
                    <Hash size={14} className="text-slate-400" />
                    {ch.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowSendModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSendSelected} disabled={!sendChannelId} className="btn-primary flex-1 disabled:opacity-50">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── File card component ──────────────────────────────────────
function FileCard({
  file, isSelected, isMultiSelected, isMultiSelecting, onSelect, onMultiSelect, onDelete,
}: {
  file: SharedFile
  isSelected: boolean
  isMultiSelected: boolean
  isMultiSelecting: boolean
  onSelect: () => void
  onMultiSelect: () => void
  onDelete: () => void
}) {
  const Icon = getFileIcon(file)
  const colorClass = getFileColor(file)

  return (
    <div
      onClick={() => isMultiSelecting ? onMultiSelect() : onSelect()}
      className={cn(
        'card p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-all cursor-pointer group relative',
        isSelected && !isMultiSelecting && 'border-primary-400 ring-2 ring-primary-500/20',
        isMultiSelected && 'border-primary-400 ring-2 ring-primary-500/20 bg-primary-50/50 dark:bg-primary-900/20',
      )}
    >
      {isMultiSelecting && (
        <div className={cn(
          'absolute top-2 left-2 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
          isMultiSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
        )}>
          {isMultiSelected && <Check size={10} className="text-white" />}
        </div>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div className="w-full">
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
        <p className="text-xs text-slate-400">{formatDate(file.created_at)}</p>
      </div>
      {!isMultiSelecting && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
