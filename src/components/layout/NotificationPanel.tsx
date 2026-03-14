'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { formatDate } from '@/lib/utils'
import { Bell, CheckCheck, MessageSquare, UserPlus, Paperclip, AtSign } from 'lucide-react'
import Link from 'next/link'

const TYPE_ICONS = {
  mention: AtSign,
  assigned: UserPlus,
  comment: MessageSquare,
  file: Paperclip,
  message: MessageSquare,
}

const TYPE_COLORS = {
  mention: 'bg-violet-100 text-violet-600',
  assigned: 'bg-blue-100 text-blue-600',
  comment: 'bg-amber-100 text-amber-600',
  file: 'bg-emerald-100 text-emerald-600',
  message: 'bg-indigo-100 text-indigo-600',
}

export function NotificationPanel() {
  const { notifications, markAllRead, markRead, setNotificationPanelOpen } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setNotificationPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setNotificationPanelOpen])

  const unread = notifications.filter((n) => !n.read)

  return (
    <div
      ref={ref}
      className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
          {unread.length > 0 && (
            <span className="px-1.5 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
              {unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Bell size={32} className="mb-2 opacity-30" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type]
            const colorClass = TYPE_COLORS[notif.type]
            return (
              <Link
                key={notif.id}
                href={notif.link ?? '#'}
                onClick={() => {
                  markRead(notif.id)
                  setNotificationPanelOpen(false)
                }}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!notif.read ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                  <Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{notif.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(notif.created_at)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-2" />
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
