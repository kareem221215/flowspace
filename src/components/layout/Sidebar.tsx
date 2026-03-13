'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  MessageSquare,
  FolderOpen,
  Briefcase,
  Settings,
  ChevronDown,
  Plus,
  Hash,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/todos', icon: CheckSquare, label: 'Todos' },
  { href: '/notes', icon: FileText, label: 'Notes' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/files', icon: FolderOpen, label: 'Files' },
  { href: '/projects', icon: Briefcase, label: 'Projects' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, projects, channels, unreadCount, activeChannelId, setActiveChannel } =
    useAppStore()
  const [projectsOpen, setProjectsOpen] = useState(true)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  const [channelsOpen, setChannelsOpen] = useState(true)

  const publicChannels = channels.filter((c) => !c.is_dm)
  const dmChannels = channels.filter((c) => c.is_dm)
  const totalUnread = channels.reduce((acc, c) => acc + (c.unread_count ?? 0), 0)

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
      {/* Logo / Workspace */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">FlowSpace</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">My Workspace</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const showBadge = label === 'Messages' && totalUnread > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn('sidebar-item', isActive && 'active')}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="px-1.5 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                  {totalUnread}
                </span>
              )}
            </Link>
          )
        })}

        <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Projects section */}
          <div
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="flex items-center gap-1.5 flex-1 text-left"
            >
              <ChevronDown
                size={12}
                className={cn('transition-transform', !projectsOpen && '-rotate-90')}
              />
              Projects
            </button>
            <button
              className="ml-auto p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() => {/* handled by projects page */}}
            >
              <Plus size={12} />
            </button>
          </div>

          {projectsOpen &&
            projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  'sidebar-item',
                  pathname === `/projects/${project.id}` && 'active',
                )}
              >
                <span
                  className="w-5 h-5 rounded text-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: project.color + '20' }}
                >
                  {project.emoji}
                </span>
                <span className="truncate">{project.name}</span>
              </Link>
            ))}

          {/* Channels section */}
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronDown
              size={12}
              className={cn('transition-transform', !channelsOpen && '-rotate-90')}
            />
            Channels
          </button>

          {channelsOpen && (
            <>
              {publicChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch.id)
                    router.push('/messages')
                  }}
                  className={cn(
                    'sidebar-item w-full text-left',
                    pathname === '/messages' && activeChannelId === ch.id && 'active',
                  )}
                >
                  <Hash size={14} className="shrink-0" />
                  <span className="flex-1 truncate">{ch.name}</span>
                  {(ch.unread_count ?? 0) > 0 && (
                    <span className="w-4 h-4 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                      {ch.unread_count}
                    </span>
                  )}
                </button>
              ))}

              <p className="px-3 py-1 text-xs text-slate-400 dark:text-slate-500 mt-1">Direct Messages</p>
              {dmChannels.map((ch) => {
                const otherName = ch.name
                const initials = getInitials(otherName)
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannel(ch.id)
                      router.push('/messages')
                    }}
                    className={cn(
                      'sidebar-item w-full text-left',
                      pathname === '/messages' && activeChannelId === ch.id && 'active',
                    )}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center shrink-0">
                      {initials}
                    </span>
                    <span className="flex-1 truncate">{otherName}</span>
                    {(ch.unread_count ?? 0) > 0 && (
                      <span className="w-4 h-4 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {ch.unread_count}
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </nav>

      {/* Bottom: User profile */}
      <div className="px-2 py-3 border-t border-slate-100 dark:border-slate-800">
        <Link href="/settings" className="sidebar-item">
          <Settings size={16} className="shrink-0" />
          <span>Settings</span>
        </Link>
        <button onClick={handleSignOut} className="sidebar-item w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
          <LogOut size={16} className="shrink-0" />
          <span>Sign out</span>
        </button>
        {currentUser && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {getInitials(currentUser.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
          </div>
        )}
      </div>
    </aside>
  )
}
