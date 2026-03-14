'use client'

import { create } from 'zustand'
import { Channel, Message, Note, Notification, Project, SharedFile, Todo, User } from '@/types'
import { generateId } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import * as Q from '@/lib/supabase/queries'
import toast from 'react-hot-toast'

interface InitialData {
  user: User
  team: User[]
  projects: Project[]
  todos: Todo[]
  notes: Note[]
  channels: Channel[]
  messages: Message[]
  files: SharedFile[]
}

interface AppState {
  // Auth
  currentUser: User | null
  team: User[]

  // Loading
  loading: boolean
  setLoading: (v: boolean) => void

  // Bootstrap
  setInitialData: (data: InitialData) => void

  // Projects
  projects: Project[]
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | '_count'>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Todos
  todos: Todo[]
  addTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  moveTodo: (id: string, newStatus: Todo['status'], newOrder?: number) => void

  // Notes
  notes: Note[]
  activeNoteId: string | null
  setActiveNote: (id: string | null) => void
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  // Channels & Messages
  channels: Channel[]
  messages: Message[]
  activeChannelId: string
  setActiveChannel: (id: string) => void
  setMessages: (messages: Message[]) => void
  appendMessage: (message: Message) => void
  sendMessage: (content: string) => Promise<void>
  addChannel: (name: string, projectId?: string) => Promise<void>
  deleteChannel: (id: string) => Promise<void>

  // Files
  files: SharedFile[]
  addFile: (file: SharedFile) => void
  deleteFile: (id: string, storagePath?: string) => Promise<void>
  deleteFiles: (ids: string[]) => Promise<void>

  // Notifications
  notifications: Notification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void

  // UI
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  notificationPanelOpen: boolean
  setNotificationPanelOpen: (open: boolean) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  team: [],
  loading: true,

  setLoading: (v) => set({ loading: v }),

  setInitialData: (data) =>
    set({
      currentUser: data.user,
      team: data.team,
      projects: data.projects,
      todos: data.todos,
      notes: data.notes,
      channels: data.channels,
      messages: data.messages,
      files: data.files,
      activeChannelId: data.channels[0]?.id ?? '',
      activeNoteId: data.notes[0]?.id ?? null,
      loading: false,
    }),

  // ── Projects ──────────────────────────────────────────────
  projects: [],
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: async (project) => {
    const supabase = createClient()
    const temp: Project = {
      ...project,
      id: `temp-${generateId()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _count: { todos: 0, notes: 0, files: 0 },
    }
    set((s) => ({ projects: [temp, ...s.projects] }))
    const saved = await Q.createProject(supabase, project)
    if (!saved) {
      set((s) => ({ projects: s.projects.filter((p) => p.id !== temp.id) }))
      toast.error('Failed to create project')
      return
    }
    set((s) => ({
      projects: s.projects.map((p) => (p.id === temp.id ? { ...saved, _count: temp._count } : p)),
    }))
  },

  deleteProject: async (id) => {
    const prev = get().projects
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      set({ projects: prev })
      toast.error('Failed to delete project')
    }
  },

  // ── Todos ──────────────────────────────────────────────────
  todos: [],
  addTodo: async (todo) => {
    const supabase = createClient()
    const temp: Todo = {
      ...todo,
      id: `temp-${generateId()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_private: todo.is_private ?? false,
    }
    set((s) => ({ todos: [...s.todos, temp] }))
    const saved = await Q.createTodo(supabase, todo)
    if (!saved) {
      set((s) => ({ todos: s.todos.filter((t) => t.id !== temp.id) }))
      toast.error('Failed to save task')
      return
    }
    set((s) => ({ todos: s.todos.map((t) => (t.id === temp.id ? saved : t)) }))
  },
  updateTodo: async (id, updates) => {
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t,
      ),
    }))
    const supabase = createClient()
    await Q.updateTodo(supabase, id, updates)
  },
  deleteTodo: async (id) => {
    const prev = get().todos
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
    const supabase = createClient()
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) {
      set({ todos: prev })
      toast.error('Failed to delete task')
    }
  },
  moveTodo: (id, newStatus, newOrder) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, order: newOrder ?? t.order, updated_at: new Date().toISOString() }
          : t,
      ),
    })),

  // ── Notes ──────────────────────────────────────────────────
  notes: [],
  activeNoteId: null,
  setActiveNote: (id) => set({ activeNoteId: id }),
  addNote: async (note) => {
    const supabase = createClient()
    const temp: Note = {
      ...note,
      id: `temp-${generateId()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      visibility: note.visibility ?? 'private',
    }
    set((s) => ({ notes: [temp, ...s.notes], activeNoteId: temp.id }))
    const saved = await Q.createNote(supabase, note)
    if (!saved) {
      set((s) => ({ notes: s.notes.filter((n) => n.id !== temp.id) }))
      toast.error('Failed to save note')
      return
    }
    set((s) => ({
      notes: s.notes.map((n) => (n.id === temp.id ? saved : n)),
      activeNoteId: saved.id,
    }))
  },
  updateNote: async (id, updates) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n,
      ),
    }))
    const supabase = createClient()
    await Q.updateNote(supabase, id, updates)
  },
  deleteNote: async (id) => {
    const remaining = get().notes.filter((n) => n.id !== id)
    set({ notes: remaining, activeNoteId: remaining[0]?.id ?? null })
    const supabase = createClient()
    await Q.deleteNote(supabase, id)
  },

  // ── Messages ───────────────────────────────────────────────
  channels: [],
  messages: [],
  activeChannelId: '',
  setActiveChannel: (id) => set({ activeChannelId: id }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((s) => {
      if (s.messages.some((m) => m.id === message.id)) return s
      return { messages: [...s.messages, message] }
    }),
  sendMessage: async (content) => {
    const { currentUser, activeChannelId } = get()
    if (!currentUser) return
    const supabase = createClient()
    const tempId = `temp-${generateId()}`
    const temp: Message = {
      id: tempId,
      channel_id: activeChannelId,
      content,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      user: currentUser,
    }
    set((s) => ({ messages: [...s.messages, temp] }))
    const saved = await Q.sendMessage(supabase, activeChannelId, content, currentUser.id)
    if (!saved) {
      set((s) => ({ messages: s.messages.filter((m) => m.id !== tempId) }))
      toast.error('Failed to send message')
      return
    }
    // Realtime will deliver the confirmed message; just swap temp out
    set((s) => ({
      messages: s.messages.map((m) => (m.id === tempId ? { ...saved, user: currentUser } : m)),
    }))
  },
  addChannel: async (name, projectId) => {
    const supabase = createClient()
    const saved = await Q.createChannel(supabase, name, projectId)
    if (saved) set((s) => ({ channels: [...s.channels, { ...saved, unread_count: 0 }] }))
  },
  deleteChannel: async (id) => {
    const prev = get().channels
    const prevActiveId = get().activeChannelId
    set((s) => {
      const remaining = s.channels.filter((c) => c.id !== id)
      return {
        channels: remaining,
        activeChannelId: prevActiveId === id ? (remaining[0]?.id ?? '') : prevActiveId,
      }
    })
    const supabase = createClient()
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (error) {
      set({ channels: prev, activeChannelId: prevActiveId })
      toast.error('Failed to delete channel')
    }
  },

  // ── Files ──────────────────────────────────────────────────
  files: [],
  addFile: (file) => set((s) => ({ files: [file, ...s.files] })),
  deleteFile: async (id, storagePath) => {
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }))
    const supabase = createClient()
    await Q.deleteSharedFile(supabase, id, storagePath)
  },
  deleteFiles: async (ids) => {
    const prev = get().files
    const toDelete = get().files.filter((f) => ids.includes(f.id))
    set((s) => ({ files: s.files.filter((f) => !ids.includes(f.id)) }))
    const supabase = createClient()
    const { error } = await supabase.from('shared_files').delete().in('id', ids)
    if (error) {
      set({ files: prev })
      toast.error('Failed to delete files')
      return
    }
    // Remove from storage bucket
    const storagePaths = toDelete.map((f) => f.storage_path).filter(Boolean) as string[]
    if (storagePaths.length) {
      await supabase.storage.from('files').remove(storagePaths)
    }
  },

  // ── Notifications ──────────────────────────────────────────
  notifications: [],
  unreadCount: 0,
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  // ── UI ─────────────────────────────────────────────────────
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notificationPanelOpen: false,
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

  // ── Theme ───────────────────────────────────────────────────
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))
