'use client'

import { useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { CodeViewer } from '@/components/files/CodeViewer'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, formatFileSize, getInitials, cn } from '@/lib/utils'
import { uploadFile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import {
  Upload,
  File,
  FileCode,
  FileImage,
  FileArchive,
  Download,
  Trash2,
  Grid,
  List,
  Search,
  Loader2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

function getFileIcon(file: { type: string; is_code: boolean }) {
  if (file.is_code) return FileCode
  if (file.type.startsWith('image/')) return FileImage
  if (file.type.includes('zip') || file.type.includes('archive')) return FileArchive
  return File
}

function getFileColor(file: { type: string; is_code: boolean }) {
  if (file.is_code) return 'text-violet-500 bg-violet-50'
  if (file.type.startsWith('image/')) return 'text-emerald-500 bg-emerald-50'
  if (file.type.includes('zip')) return 'text-amber-500 bg-amber-50'
  return 'text-blue-500 bg-blue-50'
}

export default function FilesPage() {
  const { files, deleteFile, addFile, currentUser, team } = useAppStore()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allUsers = currentUser ? [currentUser, ...team] : team
  const filtered = files.filter((f) =>
    search ? f.name.toLowerCase().includes(search.toLowerCase()) : true,
  )
  const selectedFile = files.find((f) => f.id === selected)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    setUploading(true)
    setUploadProgress(10)

    try {
      const supabase = createClient()
      setUploadProgress(30)
      const saved = await uploadFile(supabase, file, currentUser.id)
      setUploadProgress(90)
      if (saved) {
        addFile(saved)
        toast.success(`${file.name} uploaded`)
        setSelected(saved.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (selected === id) setSelected(null)
    await deleteFile(id)
    toast.success('File deleted')
  }

  async function handleDownload(file: (typeof files)[0]) {
    if (!file.url || file.url === '#') {
      toast.error('No download URL available')
      return
    }
    const a = document.createElement('a')
    a.href = file.url
    a.download = file.name
    a.target = '_blank'
    a.click()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Files"
        subtitle={`${files.length} files`}
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={15} /> Upload File
                </>
              )}
            </button>
          </>
        }
      />

      {/* Upload progress bar */}
      {uploading && (
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* File list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search files…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 py-1.5 text-sm"
              />
            </div>
            <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={cn('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600')}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600')}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <File size={48} className="mb-3 opacity-20" />
                <p className="font-medium text-slate-500">No files yet</p>
                <p className="text-sm mt-1">Upload a file to get started</p>
                <button onClick={() => fileInputRef.current?.click()} className="btn-primary mt-4">
                  <Upload size={15} /> Upload File
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((file) => {
                  const Icon = getFileIcon(file)
                  const colorClass = getFileColor(file)
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelected(selected === file.id ? null : file.id)}
                      className={cn(
                        'card p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-all cursor-pointer group relative',
                        selected === file.id && 'border-primary-400 ring-2 ring-primary-500/20',
                      )}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon size={22} />
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-medium text-slate-800 truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
                        <p className="text-xs text-slate-400">{formatDate(file.created_at)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id) }}
                        className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Size</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Uploaded by</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((file) => {
                      const Icon = getFileIcon(file)
                      const colorClass = getFileColor(file)
                      const uploader = allUsers.find((u) => u.id === file.uploaded_by)
                      return (
                        <tr
                          key={file.id}
                          onClick={() => setSelected(selected === file.id ? null : file.id)}
                          className={cn('hover:bg-slate-50 transition-colors cursor-pointer group', selected === file.id && 'bg-primary-50')}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass}`}>
                                <Icon size={14} />
                              </div>
                              <span className="font-medium text-slate-800">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatFileSize(file.size)}</td>
                          <td className="px-4 py-3">
                            {uploader && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">
                                  {getInitials(uploader.name)}
                                </div>
                                <span className="text-slate-600 text-xs">{uploader.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(file.created_at)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(file.id) }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
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
        {selectedFile && (
          <div className="w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 truncate flex-1" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Metadata */}
            <div className="p-4 border-b border-slate-100 space-y-2">
              {[
                { label: 'Size', value: formatFileSize(selectedFile.size) },
                { label: 'Type', value: selectedFile.language?.toUpperCase() ?? selectedFile.type.split('/')[1]?.toUpperCase() ?? 'File' },
                { label: 'Uploaded', value: formatDate(selectedFile.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs text-slate-700 font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-3 border-b border-slate-100">
              <button
                onClick={() => handleDownload(selectedFile)}
                className="btn-secondary flex-1 text-xs"
              >
                <Download size={13} /> Download
              </button>
              <button
                onClick={() => handleDelete(selectedFile.id)}
                className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors font-medium flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>

            {/* Code preview */}
            {selectedFile.is_code && selectedFile.content ? (
              <div className="flex-1 overflow-auto p-3">
                <CodeViewer
                  content={selectedFile.content}
                  language={selectedFile.language ?? 'text'}
                  fileName={selectedFile.name}
                  maxHeight={600}
                />
              </div>
            ) : selectedFile.type.startsWith('image/') && selectedFile.url !== '#' ? (
              <div className="flex-1 overflow-auto p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedFile.url} alt={selectedFile.name} className="w-full rounded-lg border border-slate-100" />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <File size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No preview available</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
