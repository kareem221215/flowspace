'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, PROJECT_COLORS, PROJECT_EMOJIS, getInitials, cn } from '@/lib/utils'
import { Plus, CheckSquare, FileText, FolderOpen, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const { projects, addProject, deleteProject, currentUser, team } = useAppStore()
  const allUsers = currentUser ? [currentUser, ...team] : team
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Projects"
        subtitle={`${projects.length} projects`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={15} /> New Project
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const creator = allUsers.find((u) => u.id === project.owner_id)
            const isOwn = project.owner_id === currentUser?.id
            return (
              <div key={project.id} className="relative group/card">
                <Link href={`/projects/${project.id}`}>
                  <div className="card p-5 hover:shadow-md transition-all cursor-pointer group h-full">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span
                        className="w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        {project.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate">
                            {project.name}
                          </h3>
                          {isOwn && (
                            <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
                              Yours
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Color bar */}
                    <div className="h-1 rounded-full mb-4" style={{ backgroundColor: project.color }} />

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckSquare size={12} className="text-primary-400" />
                        {project._count?.todos ?? 0} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} className="text-violet-400" />
                        {project._count?.notes ?? 0} notes
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen size={12} className="text-emerald-400" />
                        {project._count?.files ?? 0} files
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      {creator ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-white text-xs font-medium" style={{ fontSize: '8px' }}>{getInitials(creator.name)}</span>
                          </div>
                          <span className="text-xs text-slate-400">{isOwn ? 'You' : creator.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Created {formatDate(project.created_at)}</span>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </Link>
                {isOwn && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      if (confirm(`Delete "${project.name}"?`)) deleteProject(project.id)
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}

          {/* New project placeholder */}
          <button
            onClick={() => setShowModal(true)}
            className="card p-5 hover:shadow-md transition-all cursor-pointer border-2 border-dashed flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary-500 hover:border-primary-300 min-h-[160px]"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">New Project</span>
          </button>
        </div>
      </div>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { addProject, currentUser } = useAppStore()
  const user = currentUser!
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [emoji, setEmoji] = useState(PROJECT_EMOJIS[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      emoji,
      owner_id: user.id,
    })
    toast.success(`Project "${name}" created!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span
              className="w-10 h-10 rounded-xl text-2xl flex items-center justify-center"
              style={{ backgroundColor: color + '20' }}
            >
              {emoji}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name || 'Project Name'}</p>
              <p className="text-xs text-slate-400">{description || 'Description'}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Project Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="input"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* Emoji picker */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-base hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                    emoji === e && 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform hover:scale-110',
                    color === c && 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!name.trim()}>
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
