'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Header } from '@/components/layout/Header'
import { TaskCard } from '@/components/todos/TaskCard'
import { AddTaskModal } from '@/components/todos/AddTaskModal'
import { useAppStore } from '@/store/useAppStore'
import { Todo, TodoStatus } from '@/types'
import { Plus, Circle, Timer, CheckCircle2, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS: { id: TodoStatus; label: string; icon: React.ElementType; color: string; dotColor: string }[] = [
  { id: 'backlog', label: 'Backlog', icon: Archive, color: 'text-slate-500', dotColor: 'bg-slate-300' },
  { id: 'todo', label: 'Todo', icon: Circle, color: 'text-blue-500', dotColor: 'bg-blue-400' },
  { id: 'in_progress', label: 'In Progress', icon: Timer, color: 'text-amber-500', dotColor: 'bg-amber-400' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500', dotColor: 'bg-emerald-400' },
]

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      id={id}
      className={cn(
        'flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors overflow-y-auto',
        'bg-slate-100/60 dark:bg-slate-800/60 border-2 border-transparent',
        isOver && 'bg-primary-50/50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
      )}
    >
      {children}
    </div>
  )
}

export default function TodosPage() {
  const { todos, moveTodo } = useAppStore()
  const [addingToColumn, setAddingToColumn] = useState<TodoStatus | null>(null)
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const getTodosForColumn = useCallback(
    (status: TodoStatus) =>
      todos.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [todos],
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTodo(todos.find((t) => t.id === active.id) ?? null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeTodo = todos.find((t) => t.id === activeId)
    if (!activeTodo) return

    const overColumn = COLUMNS.find((c) => c.id === overId)
    if (overColumn && activeTodo.status !== overColumn.id) {
      moveTodo(activeId, overColumn.id)
    }

    const overTodo = todos.find((t) => t.id === overId)
    if (overTodo && overTodo.status !== activeTodo.status) {
      moveTodo(activeId, overTodo.status, overTodo.order)
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTodo(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeTodo = todos.find((t) => t.id === activeId)
    if (!activeTodo) return

    const overColumn = COLUMNS.find((c) => c.id === overId)
    if (overColumn) {
      moveTodo(activeId, overColumn.id)
      return
    }

    const overTodo = todos.find((t) => t.id === overId)
    if (overTodo && overTodo.id !== activeId) {
      moveTodo(activeId, overTodo.status, overTodo.order)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Todos"
        subtitle={`${todos.filter((t) => t.status !== 'done').length} open tasks`}
        actions={
          <button
            onClick={() => setAddingToColumn('todo')}
            className="btn-primary"
          >
            <Plus size={15} /> New Task
          </button>
        }
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((col) => {
              const columnTodos = getTodosForColumn(col.id)
              return (
                <div key={col.id} className="flex flex-col w-72 shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <col.icon size={15} className={col.color} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                    <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-2 py-0.5 rounded-full">
                      {columnTodos.length}
                    </span>
                  </div>

                  <SortableContext
                    id={col.id}
                    items={columnTodos.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableColumn id={col.id}>
                      {columnTodos.map((todo) => (
                        <TaskCard key={todo.id} todo={todo} />
                      ))}

                      <button
                        onClick={() => setAddingToColumn(col.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border-2 border-dashed border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                      >
                        <Plus size={13} className="group-hover:text-primary-500" />
                        Add task
                      </button>
                    </DroppableColumn>
                  </SortableContext>
                </div>
              )
            })}
          </div>

          {typeof document !== 'undefined' &&
            createPortal(
              <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                {activeTodo && <TaskCard todo={activeTodo} overlay />}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>

      {addingToColumn && (
        <AddTaskModal
          defaultStatus={addingToColumn}
          onClose={() => setAddingToColumn(null)}
        />
      )}
    </div>
  )
}
