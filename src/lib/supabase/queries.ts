import type { SupabaseClient } from '@supabase/supabase-js'
import type { Channel, Message, Note, Project, SharedFile, Todo, User } from '@/types'

// ── Profiles ────────────────────────────────────────────────
export async function getProfile(supabase: SupabaseClient, userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, created_at')
    .eq('id', userId)
    .single()
  if (!data) return null
  return { ...data, email: '' } // email comes from auth.users, not profiles
}

export async function getTeamProfiles(supabase: SupabaseClient): Promise<User[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, created_at')
  return (data ?? []).map((p) => ({ ...p, email: '' }))
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: { name?: string; avatar_url?: string },
) {
  return supabase.from('profiles').update(updates).eq('id', userId)
}

// ── Projects ─────────────────────────────────────────────────
export async function getProjects(supabase: SupabaseClient): Promise<Project[]> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createProject(
  supabase: SupabaseClient,
  project: Omit<Project, 'id' | 'created_at' | 'updated_at' | '_count' | 'members'>,
): Promise<Project | null> {
  const { data } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  return data
}

// ── Todos ────────────────────────────────────────────────────
export async function getTodos(supabase: SupabaseClient): Promise<Todo[]> {
  const { data } = await supabase
    .from('todos')
    .select('*')
    .order('order', { ascending: true })
  return (data ?? []).map((t) => ({ ...t, is_private: t.is_private ?? false }))
}

export async function createTodo(
  supabase: SupabaseClient,
  todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>,
): Promise<Todo | null> {
  const { data } = await supabase
    .from('todos')
    .insert({ ...todo, updated_at: new Date().toISOString() })
    .select()
    .single()
  return data
}

export async function updateTodo(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Todo>,
): Promise<void> {
  await supabase
    .from('todos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteTodo(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from('todos').delete().eq('id', id)
}

// ── Notes ────────────────────────────────────────────────────
export async function getNotes(supabase: SupabaseClient): Promise<Note[]> {
  const { data } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
  return (data ?? []).map((n) => ({
    ...n,
    content: JSON.stringify(n.content),
    visibility: n.visibility ?? 'private',
  }))
}

export async function createNote(
  supabase: SupabaseClient,
  note: Omit<Note, 'id' | 'created_at' | 'updated_at'>,
): Promise<Note | null> {
  const { data } = await supabase
    .from('notes')
    .insert({
      ...note,
      content: JSON.parse(note.content),
      updated_at: new Date().toISOString(),
      visibility: note.visibility ?? 'private',
    })
    .select()
    .single()
  return data ? { ...data, content: JSON.stringify(data.content), visibility: data.visibility ?? 'private' } : null
}

export async function updateNote(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Note>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  if (updates.content) {
    try { payload.content = JSON.parse(updates.content) } catch { /* keep as string */ }
  }
  await supabase.from('notes').update(payload).eq('id', id)
}

export async function deleteNote(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from('notes').delete().eq('id', id)
}

// ── Channels ─────────────────────────────────────────────────
export async function getChannels(supabase: SupabaseClient): Promise<Channel[]> {
  const { data } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function createChannel(
  supabase: SupabaseClient,
  name: string,
  projectId?: string,
): Promise<Channel | null> {
  const { data } = await supabase
    .from('channels')
    .insert({ name, is_dm: false, project_id: projectId ?? null })
    .select()
    .single()
  return data
}

export async function createDM(
  supabase: SupabaseClient,
  otherUserName: string,
  currentUserId: string,
  otherUserId: string,
): Promise<Channel | null> {
  // Generate UUID client-side so we can INSERT without .select()
  // (avoids RLS chicken-and-egg: SELECT policy requires channel_members to exist first)
  const channelId = crypto.randomUUID()

  const { error } = await supabase
    .from('channels')
    .insert({ id: channelId, name: otherUserName, is_dm: true })
  if (error) return null

  await supabase.from('channel_members').insert([
    { channel_id: channelId, user_id: currentUserId },
    { channel_id: channelId, user_id: otherUserId },
  ])

  // Now channel_members exist so the SELECT policy passes
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single()

  return channel
}

// ── Messages ─────────────────────────────────────────────────
export async function getMessages(
  supabase: SupabaseClient,
  channelId: string,
): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*, user:profiles(id, name, avatar_url)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(100)
  return (data ?? []).map((m) => ({
    ...m,
    user: m.user ? { ...m.user, email: '' } : undefined,
    reactions: m.reactions ?? [],
  }))
}

export async function sendMessage(
  supabase: SupabaseClient,
  channelId: string,
  content: string,
  userId: string,
): Promise<Message | null> {
  const { data } = await supabase
    .from('messages')
    .insert({ channel_id: channelId, content, user_id: userId })
    .select('*, user:profiles(id, name, avatar_url)')
    .single()
  return data ? { ...data, user: data.user ? { ...data.user, email: '' } : undefined } : null
}

// ── Files ────────────────────────────────────────────────────
export async function getFiles(supabase: SupabaseClient): Promise<SharedFile[]> {
  const { data } = await supabase
    .from('shared_files')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function deleteSharedFile(
  supabase: SupabaseClient,
  id: string,
  storagePath?: string,
): Promise<void> {
  await supabase.from('shared_files').delete().eq('id', id)
  if (storagePath) {
    await supabase.storage.from('files').remove([storagePath])
  }
}

const CODE_EXTENSIONS: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cs: 'csharp', cpp: 'cpp', c: 'c', php: 'php',
  sql: 'sql', json: 'json', yaml: 'yaml', yml: 'yaml',
  html: 'html', css: 'css', scss: 'scss', md: 'markdown', sh: 'bash',
}

export async function uploadFile(
  supabase: SupabaseClient,
  file: File,
  userId: string,
  projectId?: string,
  folderMeta?: { folderId: string; folderName: string; relativePath: string },
): Promise<SharedFile | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const language = CODE_EXTENSIONS[ext]
  const isCode = !!language

  const storagePath = folderMeta
    ? `${userId}/${folderMeta.folderId}/${folderMeta.relativePath}`
    : `${userId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(storagePath, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(storagePath)

  let content: string | undefined
  if (isCode && file.size < 500_000) {
    content = await file.text()
  }

  const { data } = await supabase
    .from('shared_files')
    .insert({
      name: file.name,
      size: file.size,
      type: file.type || `application/${ext}`,
      url: publicUrl,
      project_id: projectId ?? null,
      uploaded_by: userId,
      is_code: isCode,
      language: language ?? null,
      content: content ?? null,
      storage_path: storagePath,
      folder_id: folderMeta?.folderId ?? null,
      folder_name: folderMeta?.folderName ?? null,
      relative_path: folderMeta?.relativePath ?? null,
    })
    .select()
    .single()

  return data
}

export async function uploadPastedImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
): Promise<string | null> {
  const ext = file.type.split('/')[1] ?? 'png'
  const storagePath = `${userId}/pastes/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('files').upload(storagePath, file)
  if (error) return null
  const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(storagePath)
  return publicUrl
}
