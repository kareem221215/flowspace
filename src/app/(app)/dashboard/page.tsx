'use client'

import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store/useAppStore'
import { PRIORITY_CONFIG, formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'
import {
  CheckSquare,
  FileText,
  FolderOpen,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react'

export default function DashboardPage() {
  const { currentUser, todos, notes, projects, files, notifications } = useAppStore()
  const user = currentUser!

  const myTodos = todos.filter(
    (t) => t.assignee_id === user.id && t.status !== 'done',
  ).slice(0, 4)

  const recentNotes = notes.slice(0, 3)

  const todoCounts = {
    total: todos.length,
    done: todos.filter((t) => t.status === 'done').length,
    inProgress: todos.filter((t) => t.status === 'in_progress').length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`Good morning, ${user.name.split(' ')[0]} 👋`}
        subtitle="Here's what's happening across your workspace"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Open Tasks',
              value: todoCounts.total - todoCounts.done,
              icon: CheckSquare,
              color: 'text-primary-600 dark:text-primary-400',
              bg: 'bg-primary-50 dark:bg-primary-900/30',
              href: '/todos',
            },
            {
              label: 'In Progress',
              value: todoCounts.inProgress,
              icon: TrendingUp,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-900/30',
              href: '/todos',
            },
            {
              label: 'Notes',
              value: notes.length,
              icon: FileText,
              color: 'text-violet-600 dark:text-violet-400',
              bg: 'bg-violet-50 dark:bg-violet-900/30',
              href: '/notes',
            },
            {
              label: 'Projects',
              value: projects.length,
              icon: FolderOpen,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/30',
              href: '/projects',
            },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Tasks */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My Tasks</h2>
                <p className="text-xs text-slate-400 mt-0.5">Assigned to you</p>
              </div>
              <Link href="/todos" className="btn-ghost text-xs">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {myTodos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <CheckSquare size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No tasks assigned to you</p>
                  <Link href="/todos" className="btn-primary mt-3 text-xs">
                    <Plus size={13} /> New task
                  </Link>
                </div>
              ) : (
                myTodos.map((todo) => {
                  const p = PRIORITY_CONFIG[todo.priority]
                  return (
                    <Link key={todo.id} href="/todos">
                      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${todo.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100">
                            {todo.title}
                          </p>
                          {todo.due_date && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock size={11} />
                              Due {formatDate(todo.due_date)}
                            </p>
                          )}
                        </div>
                        <span className={`badge ${p.bg} ${p.color} shrink-0`}>{p.label}</span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Recent Notes */}
            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Notes</h2>
                <Link href="/notes" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 font-medium">
                  View all
                </Link>
              </div>
              <div className="p-2 space-y-1">
                {recentNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-4 text-center">No notes yet</p>
                ) : recentNotes.map((note) => (
                  <Link key={note.id} href="/notes">
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <FileText size={14} className="text-violet-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-200 truncate font-medium">{note.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(note.updated_at)}</p>
                      </div>
                      {note.is_pinned && <span className="text-xs text-amber-500 shrink-0">📌</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
                <Link href="/projects" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 font-medium">
                  View all
                </Link>
              </div>
              <div className="p-2 space-y-1">
                {projects.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-4 text-center">No projects yet</p>
                ) : projects.slice(0, 3).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <span className="w-7 h-7 rounded-lg text-base flex items-center justify-center shrink-0" style={{ backgroundColor: project.color + '20' }}>
                        {project.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{project.name}</p>
                        <p className="text-xs text-slate-400">{project._count?.todos ?? 0} tasks · {project._count?.notes ?? 0} notes</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
