'use server'

import { createClient } from '@/lib/supabase/server'
import {
  findProfileIdByUsername,
  getConversationsForUser,
  orderedPair,
} from '@/lib/data/messages'
import { encodeSharedPostMessage } from '@/lib/messages/share'
import { revalidatePath } from 'next/cache'

export type MessageActionResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string }

export type ShareConversationItem = {
  conversationId: string
  peerDisplayName: string
  peerUsername: string
  peerAvatarPath: string | null
}

export async function getOrCreateConversationWithUser(
  otherUserId: string,
): Promise<MessageActionResult> {
  const trimmed = otherUserId.trim()
  if (!trimmed) {
    return { ok: false, error: 'Choose a user to message.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  if (trimmed === user.id) {
    return { ok: false, error: 'You cannot message yourself.' }
  }

  const [userLow, userHigh] = orderedPair(user.id, trimmed)

  const { data: existing, error: findError } = await supabase
    .from('direct_conversations')
    .select('id')
    .eq('user_low', userLow)
    .eq('user_high', userHigh)
    .maybeSingle()

  if (findError) {
    return { ok: false, error: findError.message }
  }

  if (existing?.id) {
    return { ok: true, conversationId: existing.id }
  }

  const { data: created, error: insertError } = await supabase
    .from('direct_conversations')
    .insert({ user_low: userLow, user_high: userHigh })
    .select('id')
    .single()

  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? 'Could not start chat.' }
  }

  revalidatePath('/messages')
  return { ok: true, conversationId: created.id }
}

export async function openConversationByUsername(
  username: string,
): Promise<MessageActionResult> {
  const peerId = await findProfileIdByUsername(username)
  if (!peerId) {
    return { ok: false, error: 'No user found with that username.' }
  }
  return getOrCreateConversationWithUser(peerId)
}

export async function sharePostToUsername(input: {
  username: string
  postId: string
  authorUsername: string
  caption: string
  imageSrc: string
}): Promise<MessageActionResult> {
  const username = input.username.trim()
  if (!username) {
    return { ok: false, error: 'Enter a username to share with.' }
  }

  const conv = await openConversationByUsername(username)
  if (!conv.ok) {
    return conv
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const body = encodeSharedPostMessage({
    postId: input.postId,
    authorUsername: input.authorUsername,
    caption: input.caption.slice(0, 2000),
    imageSrc: input.imageSrc,
  })

  const { error } = await supabase.from('direct_messages').insert({
    conversation_id: conv.conversationId,
    sender_id: user.id,
    body,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${conv.conversationId}`)
  return { ok: true, conversationId: conv.conversationId }
}

export async function getShareConversationItems(): Promise<{
  ok: true
  items: ShareConversationItem[]
} | {
  ok: false
  error: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const convs = await getConversationsForUser(user.id)
  return {
    ok: true,
    items: convs.map((c) => ({
      conversationId: c.id,
      peerDisplayName: c.peerDisplayName,
      peerUsername: c.peerUsername,
      peerAvatarPath: c.peerAvatarPath,
    })),
  }
}

export async function sharePostToConversation(input: {
  conversationId: string
  postId: string
  authorUsername: string
  caption: string
  imageSrc: string
}): Promise<MessageActionResult> {
  const conversationId = input.conversationId.trim()
  if (!conversationId) {
    return { ok: false, error: 'Invalid conversation.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const { data: conv, error: convErr } = await supabase
    .from('direct_conversations')
    .select('id, user_low, user_high')
    .eq('id', conversationId)
    .maybeSingle()

  if (convErr || !conv) {
    return { ok: false, error: convErr?.message ?? 'Conversation not found.' }
  }
  if (conv.user_low !== user.id && conv.user_high !== user.id) {
    return { ok: false, error: 'You cannot share to this conversation.' }
  }

  const body = encodeSharedPostMessage({
    postId: input.postId,
    authorUsername: input.authorUsername,
    caption: input.caption.slice(0, 2000),
    imageSrc: input.imageSrc,
  })

  const { error } = await supabase.from('direct_messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)
  return { ok: true, conversationId }
}
