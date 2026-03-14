'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Priority, Todo, TodoStatus } from '@/types'
import { X, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddTaskModalProps {
  defaultStatus?: TodoStatus
  todo?: Todo
  onClose: () => void
}

export function AddTaskModal({ defaultStatus = 'todo', todo, onClose }: AddTaskModalProps) {
  const { currentUser, projects, addTodo, updateTodo } = useAppStore()
  const user = currentUser!
  const isEdit = !!todo

  const [title, setTitle] = useState(todo?.title ?? '')
  const [description, setDescription] = useState(todo?.description ?? '')
  const [priority, setPriority] = useState<Priority>(todo?.priority ?? 'medium')
  const [projectId, setProjectId] = useState(todo?.project_id ?? '')
  const [dueDate, setDueDate] = useState(todo?.due_date?.split('T')[0] ?? '')
  const [isPrivate, setIsPrivate] = useState(todo?.is_private ?? false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (isEdit) {
      updateTodo(todo.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        project_id: projectId || undefined,
        due_date: dueDate || undefined,
        is_private: isPrivate,
      })
    } else {
      addTodo({
        title: title.trim(),
        description: description.trim() || undefined,
        status: defaultStatus,
        priority,
        project_id: projectId || undefined,
        due_date: dueDate || undefined,
        created_by: user.id,
        order: 999,
        labels: [],
        is_private: isPrivate,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              autoFocus
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-base font-medium placeholder:font-normal"
            />
          </div>

          <div>
            <textarea
              placeholder="Add a description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input">
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </div>

          {/* Visibility toggle */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Visibility</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors',
                  !isPrivate
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                <Globe size={13} /> Workspace
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors border-l border-slate-200 dark:border-slate-700',
                  isPrivate
                    ? 'bg-slate-700 text-white dark:bg-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                <Lock size={13} /> Only me
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {isPrivate ? 'Only you can see this task.' : 'Everyone in the workspace can see this task.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!title.trim()}>
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
