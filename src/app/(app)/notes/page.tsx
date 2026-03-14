'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, truncate, getInitials, cn } from '@/lib/utils'
import { Plus, FileText, Pin, Trash2, Search, MoreHorizontal, Globe, Lock, Users } from 'lucide-react'

export default function NotesPage() {
  const { notes, activeNoteId, setActiveNote, addNote, deleteNote, updateNote, currentUser, team, projects } =
    useAppStore()
  const user = currentUser!
  const allUsers = [user, ...team]
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine' | 'shared'>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const filtered = notes.filter((n) => {
    const matchesSearch = search ? n.title.toLowerCase().includes(search.toLowerCase()) : true
    if (!matchesSearch) return false
    if (filter === 'mine') return n.created_by === user.id
    if (filter === 'shared') return n.visibility === 'workspace'
    if (projectFilter !== 'all') return n.project_id === projectFilter
    return true
  })

  const pinned = filtered.filter((n) => n.is_pinned)
  const unpinned = filtered.filter((n) => !n.is_pinned)

  function handleNewNote(projectId?: string) {
    addNote({
      title: 'Untitled',
      content: JSON.stringify({ type: 'doc', content: [] }),
      created_by: user.id,
      is_pinned: false,
      visibility: 'private',
      project_id: projectId,
    })
  }

  const activeNote = notes.find((n) => n.id === activeNoteId)
  const activeNoteCreator = activeNote ? allUsers.find((u) => u.id === activeNote.created_by) : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Notes"
        subtitle={`${notes.length} notes`}
        actions={
          <button onClick={handleNewNote} className="btn-primary">
            <Plus size={15} /> New Note
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Notes list sidebar */}
        <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
            {/* Filter tabs */}
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              {(['all', 'mine', 'shared'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setProjectFilter('all') }}
                  className={cn(
                    'flex-1 text-xs py-1.5 capitalize transition-colors',
                    filter === f && projectFilter === 'all'
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800',
                    f !== 'all' && 'border-l border-slate-200 dark:border-slate-700',
                  )}
                >
                  {f === 'shared' ? <span className="flex items-center justify-center gap-1"><Users size={10} />Shared</span> : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Project filter */}
            {projects.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setProjectFilter(projectFilter === p.id ? 'all' : p.id); setFilter('all') }}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors',
                      projectFilter === p.id
                        ? 'border-transparent text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600',
                    )}
                    style={projectFilter === p.id ? { backgroundColor: p.color } : {}}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {pinned.length > 0 && (
              <div>
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Pin size={10} /> Pinned
                </p>
                {pinned.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    creator={allUsers.find((u) => u.id === note.created_by)}
                    isOwn={note.created_by === user.id}
                    active={note.id === activeNoteId}
                    onClick={() => setActiveNote(note.id)}
                    onPin={() => updateNote(note.id, { is_pinned: false })}
                    onDelete={() => deleteNote(note.id)}
                    projectName={note.project_id ? projects.find((p) => p.id === note.project_id)?.name : undefined}
                  />
                ))}
              </div>
            )}

            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">All Notes</p>
                )}
                {unpinned.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    creator={allUsers.find((u) => u.id === note.created_by)}
                    isOwn={note.created_by === user.id}
                    active={note.id === activeNoteId}
                    onClick={() => setActiveNote(note.id)}
                    onPin={() => updateNote(note.id, { is_pinned: true })}
                    onDelete={() => deleteNote(note.id)}
                    projectName={note.project_id ? projects.find((p) => p.id === note.project_id)?.name : undefined}
                  />
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FileText size={28} className="mb-2 opacity-30" />
                <p className="text-xs">No notes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {activeNote ? (
            <div className="flex flex-col h-full">
              {/* Note title + meta */}
              <div className="px-8 pt-8 pb-0 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <input
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Untitled"
                  className="w-full text-2xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none bg-transparent pb-2"
                />
                <div className="flex items-center gap-3 pb-3 flex-wrap">
                  {/* Creator */}
                  {activeNoteCreator && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{getInitials(activeNoteCreator.name)}</span>
                      </div>
                      <span className="text-xs text-slate-400">{activeNoteCreator.name}</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-xs text-slate-400">Edited {formatDate(activeNote.updated_at)}</span>
                  {activeNote.project_id && (
                    <>
                      <span className="text-xs text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs text-slate-400">
                        {projects.find((p) => p.id === activeNote.project_id)?.name ?? 'Project'}
                      </span>
                    </>
                  )}

                  {/* Visibility toggle — only owner can change */}
                  {activeNote.created_by === user.id && (
                    <button
                      onClick={() => updateNote(activeNote.id, {
                        visibility: activeNote.visibility === 'workspace' ? 'private' : 'workspace',
                      })}
                      className={cn(
                        'ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                        activeNote.visibility === 'workspace'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100',
                      )}
                    >
                      {activeNote.visibility === 'workspace'
                        ? <><Globe size={11} /> Shared with workspace</>
                        : <><Lock size={11} /> Private</>
                      }
                    </button>
                  )}
                  {activeNote.created_by !== user.id && (
                    <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                      <Globe size={11} /> Shared with you
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <NoteEditor noteId={activeNote.id} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={48} className="mb-3 opacity-20" />
              <p className="text-base font-medium">No note selected</p>
              <p className="text-sm mt-1">Pick a note or create a new one</p>
              <button onClick={handleNewNote} className="btn-primary mt-4">
                <Plus size={15} /> New Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NoteListItem({
  note, creator, isOwn, active, onClick, onPin, onDelete, projectName,
}: {
  note: ReturnType<typeof useAppStore.getState>['notes'][0]
  creator?: { name: string }
  isOwn: boolean
  active: boolean
  onClick: () => void
  onPin: () => void
  onDelete: () => void
  projectName?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'w-full flex items-start gap-2 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group relative cursor-pointer',
        active && 'bg-primary-50 dark:bg-primary-900/30',
      )}
    >
      <div className="mt-0.5 shrink-0">
        {note.visibility === 'workspace'
          ? <Globe size={13} className={cn(active ? 'text-emerald-500' : 'text-emerald-400')} />
          : <FileText size={13} className={cn(active ? 'text-primary-500' : 'text-slate-400')} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', active ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300')}>
          {note.title || 'Untitled'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {!isOwn && creator && (
            <span className="text-xs text-slate-400">{creator.name} ·</span>
          )}
          <span className="text-xs text-slate-400">{formatDate(note.updated_at)}</span>
          {projectName && (
            <span className="text-xs text-slate-400 truncate">· {projectName}</span>
          )}
        </div>
      </div>

      {/* Menu — only for own notes */}
      {isOwn && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[130px]">
              <button
                onClick={(e) => { e.stopPropagation(); onPin(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Pin size={11} /> {note.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
