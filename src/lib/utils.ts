import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Priority } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-50' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50' },
}

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

export const PROJECT_EMOJIS = [
  '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '💎', '🎨',
  '🛠️', '📊', '🎪', '🏆', '🌈', '🦋', '🌺', '🎭',
]

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}
