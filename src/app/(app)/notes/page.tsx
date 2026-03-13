'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, truncate } from '@/lib/utils'
import { Plus, FileText, Pin, Trash2, Search, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotesPage() {
  const { notes, activeNoteId, setActiveNote, addNote, deleteNote, updateNote, currentUser, projects } =
    useAppStore()
  const user = currentUser!
  const [search, setSearch] = useState('')

  const filtered = notes.filter((n) =>
    search ? n.title.toLowerCase().includes(search.toLowerCase()) : true,
  )
  const pinned = filtered.filter((n) => n.is_pinned)
  const unpinned = filtered.filter((n) => !n.is_pinned)

  function handleNewNote() {
    addNote({
      title: 'Untitled',
      content: JSON.stringify({ type: 'doc', content: [] }),
      created_by: user.id,
      is_pinned: false,
    })
  }

  const activeNote = notes.find((n) => n.id === activeNoteId)

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
        <div className="w-64 shrink-0 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
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
                    active={note.id === activeNoteId}
                    onClick={() => setActiveNote(note.id)}
                    onPin={() => updateNote(note.id, { is_pinned: false })}
                    onDelete={() => deleteNote(note.id)}
                  />
                ))}
              </div>
            )}

            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    All Notes
                  </p>
                )}
                {unpinned.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    active={note.id === activeNoteId}
                    onClick={() => setActiveNote(note.id)}
                    onPin={() => updateNote(note.id, { is_pinned: true })}
                    onDelete={() => deleteNote(note.id)}
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
              {/* Note title */}
              <div className="px-8 pt-8 pb-0 bg-white border-b border-slate-100">
                <input
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Untitled"
                  className="w-full text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent pb-3"
                />
                <div className="flex items-center gap-3 pb-3 text-xs text-slate-400">
                  <span>Edited {formatDate(activeNote.updated_at)}</span>
                  {activeNote.project_id && (
                    <>
                      <span>·</span>
                      <span>
                        {projects.find((p) => p.id === activeNote.project_id)?.name ?? 'Project'}
                      </span>
                    </>
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
  note,
  active,
  onClick,
  onPin,
  onDelete,
}: {
  note: ReturnType<typeof useAppStore.getState>['notes'][0]
  active: boolean
  onClick: () => void
  onPin: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'w-full flex items-start gap-2 px-3 py-3 text-left hover:bg-slate-50 transition-colors group relative cursor-pointer',
        active && 'bg-primary-50',
      )}
    >
      <FileText size={14} className={cn('mt-0.5 shrink-0', active ? 'text-primary-500' : 'text-slate-400')} />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs font-medium truncate',
            active ? 'text-primary-700' : 'text-slate-700',
          )}
        >
          {note.title || 'Untitled'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{formatDate(note.updated_at)}</p>
      </div>

      {/* Menu */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal size={13} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-5 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[130px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPin()
                setMenuOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Pin size={11} /> {note.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                setMenuOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
