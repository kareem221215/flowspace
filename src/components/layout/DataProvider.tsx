'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import * as Q from '@/lib/supabase/queries'
import { Loader2 } from 'lucide-react'

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { setInitialData, loading, appendMessage, activeChannelId, theme, setTheme } = useAppStore()

  // ── Theme: load from localStorage and apply dark class ───
  useEffect(() => {
    const saved = localStorage.getItem('flowspace-theme') as 'light' | 'dark' | 'system' | null
    if (saved) setTheme(saved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = document.documentElement
    localStorage.setItem('flowspace-theme', theme)
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'system') {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // ── Bootstrap: load everything on mount ──────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch email separately from auth
      const [profile, team, projects, todos, notes, channels, files] = await Promise.all([
        Q.getProfile(supabase, authUser.id),
        Q.getTeamProfiles(supabase),
        Q.getProjects(supabase),
        Q.getTodos(supabase),
        Q.getNotes(supabase),
        Q.getChannels(supabase),
        Q.getFiles(supabase),
      ])

      const user = profile
        ? { ...profile, email: authUser.email ?? '' }
        : { id: authUser.id, email: authUser.email ?? '', name: authUser.email ?? 'You', created_at: new Date().toISOString() }

      // Load messages for first channel
      const firstChannelId = channels[0]?.id
      const messages = firstChannelId ? await Q.getMessages(supabase, firstChannelId) : []

      setInitialData({
        user,
        team: team.filter((t) => t.id !== authUser.id).map((t) => ({ ...t, email: '' })),
        projects,
        todos,
        notes,
        channels: channels.map((c) => ({ ...c, unread_count: 0 })),
        messages,
        files,
      })
    }

    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time: messages subscription ─────────────────────
  useEffect(() => {
    if (!activeChannelId) return
    const supabase = createClient()

    // Load messages when channel changes
    Q.getMessages(supabase, activeChannelId).then((msgs) => {
      useAppStore.getState().setMessages(msgs)
    })

    // Subscribe to new messages in this channel
    const channel = supabase
      .channel(`messages:${activeChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; user_id: string; [key: string]: unknown }
          // Fetch with user join
          const { data } = await supabase
            .from('messages')
            .select('*, user:profiles(id, name, avatar_url)')
            .eq('id', newMsg.id)
            .single()
          if (data) {
            appendMessage({ ...data, user: data.user ? { ...data.user, email: '' } : undefined })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannelId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <Loader2 size={18} className="animate-spin text-primary-500" />
          <p className="text-sm">Loading workspace…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
