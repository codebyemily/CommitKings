'use server'

import { createClient } from '@/lib/supabase/server'
import {
  findProfileIdByUsername,
  getConversationsForUser,
  orderedPair,
} from '@/lib/data/messages'
import { encodeSharedPostMessage } from '@/lib/messages/share'
import { sendOneSignalPushToExternalUsers } from '@/lib/notifications/onesignal'
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

async function insertDirectMessageAndNotify(input: {
  conversationId: string
  senderId: string
  body: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: conv, error: convErr } = await supabase
    .from('direct_conversations')
    .select('id, user_low, user_high')
    .eq('id', input.conversationId)
    .maybeSingle()

  if (convErr || !conv) {
    return { ok: false, error: convErr?.message ?? 'Conversation not found.' }
  }

  if (conv.user_low !== input.senderId && conv.user_high !== input.senderId) {
    return { ok: false, error: 'You cannot message this conversation.' }
  }

  const { error } = await supabase.from('direct_messages').insert({
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    body: input.body,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const recipientId = conv.user_low === input.senderId ? conv.user_high : conv.user_low
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', input.senderId)
    .maybeSingle()
  const username =
    typeof senderProfile?.username === 'string' && senderProfile.username.trim()
      ? senderProfile.username.trim()
      : 'user'
  const preview =
    input.body.length > 90 ? `${input.body.slice(0, 90)}...` : input.body
  void sendOneSignalPushToExternalUsers({
    externalUserIds: [recipientId],
    headings: 'New message',
    contents: `@${username}: ${preview}`,
    url: `/messages/${input.conversationId}`,
  })

  return { ok: true }
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

  const sent = await insertDirectMessageAndNotify({
    conversationId: conv.conversationId,
    senderId: user.id,
    body,
  })
  if (!sent.ok) return sent

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

  const body = encodeSharedPostMessage({
    postId: input.postId,
    authorUsername: input.authorUsername,
    caption: input.caption.slice(0, 2000),
    imageSrc: input.imageSrc,
  })

  const sent = await insertDirectMessageAndNotify({
    conversationId: conversationId,
    senderId: user.id,
    body,
  })
  if (!sent.ok) return sent

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)
  return { ok: true, conversationId }
}

export async function sendDirectMessageAction(input: {
  conversationId: string
  body: string
}): Promise<MessageActionResult> {
  const conversationId = input.conversationId.trim()
  const text = input.body.trim()
  if (!conversationId) {
    return { ok: false, error: 'Invalid conversation.' }
  }
  if (!text || text.length > 4000) {
    return { ok: false, error: 'Message must be 1-4000 characters.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const sent = await insertDirectMessageAndNotify({
    conversationId,
    senderId: user.id,
    body: text,
  })
  if (!sent.ok) {
    return sent
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)
  return { ok: true, conversationId }
}
