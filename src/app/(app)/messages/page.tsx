'use client'

import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store/useAppStore'
import { getInitials, cn } from '@/lib/utils'
import { Hash, Send, Plus, Smile, Paperclip, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const {
    channels,
    messages,
    activeChannelId,
    setActiveChannel,
    sendMessage,
    addChannel,
    deleteChannel,
    currentUser,
    team,
  } = useAppStore()
  const user = currentUser!

  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeChannel = channels.find((c) => c.id === activeChannelId)
  const channelMessages = messages.filter((m) => m.channel_id === activeChannelId)

  const allUsers = [user, ...team]
  function getUser(userId: string) {
    return allUsers.find((u) => u.id === userId)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages.length])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const storagePath = `${user.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('files').upload(storagePath, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(storagePath)
      await sendMessage(`📎 [${file.name}](${publicUrl})`)
      toast.success('File sent!')
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleCreateChannel() {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name) return
    await addChannel(name)
    setNewChannelName('')
    setShowNewChannel(false)
  }

  const publicChannels = channels.filter((c) => !c.is_dm)
  const dmChannels = channels.filter((c) => c.is_dm)

  // Group messages by day
  const groupedMessages: { date: string; messages: typeof channelMessages }[] = []
  channelMessages.forEach((msg) => {
    const day = new Date(msg.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    const group = groupedMessages.find((g) => g.date === day)
    if (group) group.messages.push(msg)
    else groupedMessages.push({ date: day, messages: [msg] })
  })

  return (
    <div className="flex h-full overflow-hidden">
      {/* Channel list */}
      <div className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          <div className="mb-3">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Channels</p>
              <button
                onClick={() => setShowNewChannel(true)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* New channel input */}
            {showNewChannel && (
              <div className="px-1 mb-2">
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700">
                  <Hash size={12} className="text-slate-400 shrink-0" />
                  <input
                    autoFocus
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateChannel()
                      if (e.key === 'Escape') { setShowNewChannel(false); setNewChannelName('') }
                    }}
                    placeholder="channel-name"
                    className="flex-1 text-xs bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
                  />
                  <button onClick={() => { setShowNewChannel(false); setNewChannelName('') }} className="text-slate-400 hover:text-slate-600">
                    <X size={10} />
                  </button>
                </div>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="mt-1 w-full text-xs py-1 rounded bg-primary-600 text-white disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            )}

            {publicChannels.map((ch) => (
              <div key={ch.id} className="group/ch relative">
                <button
                  onClick={() => setActiveChannel(ch.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left transition-colors',
                    activeChannelId === ch.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  <Hash size={14} className="shrink-0" />
                  <span className="flex-1 text-sm truncate">{ch.name}</span>
                  {(ch.unread_count ?? 0) > 0 && (
                    <span className="w-4 h-4 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center shrink-0">
                      {ch.unread_count}
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChannel(ch.id) }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/ch:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Direct Messages
            </p>
            {dmChannels.map((ch) => {
              const initials = getInitials(ch.name)
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left transition-colors',
                    activeChannelId === ch.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center shrink-0">
                    {initials}
                  </span>
                  <span className="flex-1 text-sm truncate">{ch.name}</span>
                  {(ch.unread_count ?? 0) > 0 && (
                    <span className="w-4 h-4 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center shrink-0">
                      {ch.unread_count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {activeChannel?.is_dm ? (
            <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center justify-center">
              {getInitials(activeChannel?.name ?? '')}
            </span>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <Hash size={14} className="text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activeChannel?.is_dm ? activeChannel?.name : `#${activeChannel?.name}`}
            </p>
            {!activeChannel?.is_dm && (
              <p className="text-xs text-slate-400">{channelMessages.length} messages</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {groupedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                {activeChannel?.is_dm ? (
                  <span className="text-xl">{getInitials(activeChannel?.name ?? '')}</span>
                ) : (
                  <Hash size={24} className="text-slate-300" />
                )}
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-300">
                {activeChannel?.is_dm
                  ? `Start a conversation with ${activeChannel?.name}`
                  : `Welcome to #${activeChannel?.name}`}
              </p>
              <p className="text-sm mt-1">
                {activeChannel?.is_dm
                  ? 'Send a message to get the conversation started'
                  : 'This is the beginning of this channel'}
              </p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="space-y-1">
                  {group.messages.map((msg, idx) => {
                    const msgUser = getUser(msg.user_id)
                    const isMe = msg.user_id === user.id
                    const prevMsg = group.messages[idx - 1]
                    const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id

                    // Render file link messages nicely
                    const fileMatch = msg.content.match(/^📎 \[(.+?)\]\((.+?)\)$/)

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-3 px-2 py-0.5 rounded-lg group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                          showHeader && 'mt-3',
                        )}
                      >
                        {/* Avatar */}
                        <div className="w-8 shrink-0 mt-0.5">
                          {showHeader && (
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                                isMe
                                  ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
                              )}
                            >
                              {getInitials(msgUser?.name ?? '?')}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {showHeader && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {isMe ? 'You' : msgUser?.name ?? 'Unknown'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          {fileMatch ? (
                            <a
                              href={fileMatch[2]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-primary-600 dark:text-primary-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Paperclip size={14} />
                              {fileMatch[1]}
                            </a>
                          ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {msg.reactions.map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 border border-slate-200 dark:border-slate-700 hover:border-primary-300 text-xs transition-colors"
                                >
                                  {reaction.emoji}
                                  <span className="text-slate-500">{reaction.user_ids.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploading ? 'Uploading…' : `Message ${activeChannel?.is_dm ? activeChannel?.name : `#${activeChannel?.name}`}…`}
              rows={1}
              className="flex-1 resize-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none bg-transparent py-1 leading-relaxed"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <div className="flex gap-1 shrink-0">
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Smile size={16} />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  input.trim()
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed',
                )}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-center">
            Press <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Enter</kbd> to send ·{' '}
            <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}
