'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { NotificationPanel } from './NotificationPanel'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { unreadCount, notificationPanelOpen, setNotificationPanelOpen, sidebarOpen, setSidebarOpen } =
    useAppStore()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {/* Search */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors min-w-[160px]">
          <Search size={14} />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
            className={cn(
              'relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
              notificationPanelOpen && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationPanelOpen && <NotificationPanel />}
        </div>
      </div>
    </header>
  )
}
