'use server'

import { createClient } from '@/lib/supabase/server'
import { findProfileIdByUsername, orderedPair } from '@/lib/data/messages'
import { revalidatePath } from 'next/cache'

export type MessageActionResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string }

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
