'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Todo } from '@/types'
import { PRIORITY_CONFIG, formatDate, getInitials } from '@/lib/utils'
import { Clock, MoreHorizontal, Trash2, Edit3 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AddTaskModal } from './AddTaskModal'

interface TaskCardProps {
  todo: Todo
  overlay?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
}

export function TaskCard({ todo, overlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })
  const { deleteTodo, team } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const p = PRIORITY_CONFIG[todo.priority]
  const assignee = team.find((u) => u.id === todo.assignee_id)
  const isOverdue =
    todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'done'

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-grab active:cursor-grabbing',
          'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-150',
          'group select-none',
          isDragging && 'opacity-40 scale-95',
          overlay && 'shadow-2xl scale-105 border-primary-300 cursor-grabbing',
        )}
      >
        {/* Priority + Labels */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span className={`badge ${p.bg} ${p.color}`}>{p.label}</span>
          {todo.labels?.map((label) => (
            <span key={label} className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              {label}
            </span>
          ))}
        </div>

        {/* Title */}
        <p
          className={cn(
            'text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug mb-3',
            todo.status === 'done' && 'line-through text-slate-400',
          )}
        >
          {todo.title}
        </p>

        {todo.description && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
            {todo.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2">
          {/* Assignee */}
          {assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0"
              title={assignee.name}
            >
              <span className="text-white text-xs font-medium">{getInitials(assignee.name)}</span>
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0"
              title="Unassigned"
            />
          )}

          {/* Due date */}
          {todo.due_date && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-red-500 font-medium' : 'text-slate-400',
              )}
            >
              <Clock size={11} />
              {formatDate(todo.due_date)}
            </span>
          )}

          {/* Menu */}
          <div className="ml-auto relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-6 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    setEditOpen(true)
                  }}
                >
                  <Edit3 size={12} /> Edit task
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTodo(todo.id)
                    setMenuOpen(false)
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <AddTaskModal todo={todo} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}
