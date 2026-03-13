export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  emoji: string
  owner_id: string
  created_at: string
  updated_at: string
  members?: ProjectMember[]
  _count?: { todos: number; notes: number; files: number }
}

export interface ProjectMember {
  user_id: string
  project_id: string
  role: 'owner' | 'admin' | 'member'
  user?: User
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TodoStatus = 'backlog' | 'todo' | 'in_progress' | 'done'

export interface Todo {
  id: string
  title: string
  description?: string
  status: TodoStatus
  priority: Priority
  project_id?: string
  assignee_id?: string
  due_date?: string
  created_by: string
  created_at: string
  updated_at: string
  order: number
  labels?: string[]
  assignee?: User
}

export interface Note {
  id: string
  title: string
  content: string
  project_id?: string
  created_by: string
  created_at: string
  updated_at: string
  is_pinned: boolean
}

export interface Channel {
  id: string
  name: string
  description?: string
  is_dm: boolean
  project_id?: string
  dm_users?: string[]
  created_at: string
  unread_count?: number
  last_message?: Message
}

export interface Message {
  id: string
  channel_id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  is_edited: boolean
  attachments?: MessageAttachment[]
  user?: User
  reactions?: Reaction[]
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
}

export interface Reaction {
  emoji: string
  user_ids: string[]
}

export interface SharedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  project_id?: string
  uploaded_by: string
  created_at: string
  is_code: boolean
  language?: string
  content?: string
  storage_path?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'mention' | 'assigned' | 'comment' | 'file' | 'message'
  read: boolean
  link?: string
  created_at: string
}

export type KanbanColumn = {
  id: TodoStatus
  title: string
  color: string
  todos: Todo[]
}
