'use client'

import { use } from 'react'
import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store/useAppStore'
import { PRIORITY_CONFIG, formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import { CheckSquare, FileText, FolderOpen, ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { notFound } from 'next/navigation'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { projects, todos, notes, files, updateTodo } = useAppStore()
  const project = projects.find((p) => p.id === id)

  if (!project) return notFound()

  const projectTodos = todos.filter((t) => t.project_id === id)
  const projectNotes = notes.filter((n) => n.project_id === id)
  const projectFiles = files.filter((f) => f.project_id === id)
  const doneTodos = projectTodos.filter((t) => t.status === 'done').length
  const progress = projectTodos.length > 0 ? Math.round((doneTodos / projectTodos.length) * 100) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`${project.emoji} ${project.name}`}
        subtitle={project.description}
        actions={
          <Link href="/projects" className="btn-secondary">
            <ArrowLeft size={14} /> All Projects
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Progress */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Project Progress</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {doneTodos} of {projectTodos.length} tasks completed
              </p>
            </div>
            <span
              className="text-2xl font-bold"
              style={{ color: project.color }}
            >
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: project.color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CheckSquare size={15} className="text-primary-500" />
                Tasks ({projectTodos.length})
              </h2>
              <Link href="/todos" className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                View board
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {projectTodos.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No tasks yet</p>
              ) : (
                projectTodos.map((todo) => {
                  const p = PRIORITY_CONFIG[todo.priority]
                  const isDone = todo.status === 'done'
                  return (
                    <div key={todo.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <button
                        onClick={() => updateTodo(todo.id, { status: isDone ? 'todo' : 'done' })}
                        className={cn(
                          'shrink-0 transition-colors',
                          isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400',
                        )}
                      >
                        {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          isDone && 'line-through text-slate-400',
                        )}
                      >
                        {todo.title}
                      </span>
                      <span className={`badge ${p.bg} ${p.color} shrink-0`}>{p.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Notes + Files */}
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText size={14} className="text-violet-500" />
                  Notes ({projectNotes.length})
                </h2>
                <Link href="/notes" className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                  View all
                </Link>
              </div>
              <div className="p-2 space-y-1">
                {projectNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notes yet</p>
                ) : (
                  projectNotes.map((note) => (
                    <Link key={note.id} href="/notes">
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <FileText size={13} className="text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">{note.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(note.updated_at)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FolderOpen size={14} className="text-emerald-500" />
                  Files ({projectFiles.length})
                </h2>
                <Link href="/files" className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                  View all
                </Link>
              </div>
              <div className="p-2 space-y-1">
                {projectFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No files yet</p>
                ) : (
                  projectFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50">
                      <FolderOpen size={13} className="text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(file.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
