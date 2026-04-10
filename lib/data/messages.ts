import { createClient } from '@/lib/supabase/server'
import type { DirectMessageRow } from '@/lib/messages/types'

export type ConversationListItem = {
  id: string
  peerId: string
  peerUsername: string
  peerDisplayName: string
  peerAvatarPath: string | null
  lastMessageAt: string | null
  lastMessagePreview: string | null
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export async function getConversationsForUser(
  userId: string,
): Promise<ConversationListItem[]> {
  const supabase = await createClient()

  const { data: convs, error: convError } = await supabase
    .from('direct_conversations')
    .select('id, user_low, user_high, last_message_at, last_message_preview')
    .or(`user_low.eq.${userId},user_high.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(80)

  if (convError || !convs?.length) {
    if (convError) {
      console.error('getConversationsForUser:', convError.message)
    }
    return []
  }

  const peerIds = convs.map((c) =>
    c.user_low === userId ? c.user_high : c.user_low,
  )

  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', peerIds)

  if (profError) {
    console.error('getConversationsForUser profiles:', profError.message)
  }

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        username: p.username || 'user',
        display_name: p.display_name || 'Member',
        avatar_path: p.avatar_path as string | null,
      },
    ]),
  )

  return convs.map((c) => {
    const peerId = c.user_low === userId ? c.user_high : c.user_low
    const p = profileById.get(peerId)
    return {
      id: c.id,
      peerId,
      peerUsername: p?.username ?? 'user',
      peerDisplayName: p?.display_name ?? 'Member',
      peerAvatarPath: p?.avatar_path ?? null,
      lastMessageAt: c.last_message_at,
      lastMessagePreview: c.last_message_preview,
    }
  })
}

export async function getMessagesForConversation(
  conversationId: string,
  userId: string,
): Promise<{ ok: true; messages: DirectMessageRow[] } | { ok: false }> {
  const supabase = await createClient()

  const { data: conv, error: convError } = await supabase
    .from('direct_conversations')
    .select('id, user_low, user_high')
    .eq('id', conversationId)
    .maybeSingle()

  if (convError || !conv) {
    if (convError) console.error('getMessagesForConversation conv:', convError.message)
    return { ok: false }
  }

  if (conv.user_low !== userId && conv.user_high !== userId) {
    return { ok: false }
  }

  const { data: rows, error } = await supabase
    .from('direct_messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('getMessagesForConversation:', error.message)
    return { ok: false }
  }

  return {
    ok: true,
    messages: (rows ?? []) as DirectMessageRow[],
  }
}

export async function getConversationPeerProfile(
  conversationId: string,
  userId: string,
): Promise<{
  peerId: string
  username: string
  displayName: string
  avatarPath: string | null
} | null> {
  const supabase = await createClient()

  const { data: conv, error: convError } = await supabase
    .from('direct_conversations')
    .select('user_low, user_high')
    .eq('id', conversationId)
    .maybeSingle()

  if (convError || !conv) return null

  if (conv.user_low !== userId && conv.user_high !== userId) {
    return null
  }

  const peerId = conv.user_low === userId ? conv.user_high : conv.user_low

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_path')
    .eq('id', peerId)
    .maybeSingle()

  if (error || !profile) {
    if (error) console.error('getConversationPeerProfile:', error.message)
    return {
      peerId,
      username: 'user',
      displayName: 'Member',
      avatarPath: null,
    }
  }

  return {
    peerId,
    username: profile.username || 'user',
    displayName: profile.display_name || 'Member',
    avatarPath: profile.avatar_path as string | null,
  }
}

export async function findProfileIdByUsername(
  username: string,
): Promise<string | null> {
  const q = username.trim().replace(/^@/, '')
  if (!q) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('find_profile_id_by_username', {
    q,
  })

  if (error) {
    console.error('findProfileIdByUsername:', error.message)
    return null
  }

  return typeof data === 'string' ? data : null
}

export { orderedPair }
