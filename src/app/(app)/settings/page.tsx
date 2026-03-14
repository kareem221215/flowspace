'use client'

import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store/useAppStore'
import { getInitials } from '@/lib/utils'
import { Bell, Palette, Users, Key, Save } from 'lucide-react'

export default function SettingsPage() {
  const { currentUser, theme, setTheme } = useAppStore()
  const user = currentUser!

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Manage your workspace preferences" />

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Profile */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users size={15} className="text-primary-500" />
              Profile
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-semibold">
                {getInitials(user.name)}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
                <input defaultValue={user.name} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                <input defaultValue={user.email} className="input" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Bell size={15} className="text-primary-500" />
              Notifications
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Task assignments', desc: 'When someone assigns a task to you' },
                { label: 'Mentions', desc: 'When someone @mentions you in messages' },
                { label: 'File uploads', desc: 'When new files are shared in your projects' },
                { label: 'Browser notifications', desc: 'Show desktop notifications' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Palette size={15} className="text-primary-500" />
              Appearance
            </h2>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all capitalize ${
                      theme === t
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Supabase config */}
          
        </div>
      </div>
    </div>
  )
}
