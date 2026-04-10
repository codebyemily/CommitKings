import { sendNewDirectMessagePush } from '@/lib/onesignal/send-message-push'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type WebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: {
    id?: string
    conversation_id?: string
    sender_id?: string
    body?: string
    created_at?: string
  }
  old_record?: unknown
}

/**
 * Called by Supabase Database Webhooks on `INSERT` into `public.direct_messages`.
 *
 * Dashboard: Database → Webhooks → Create hook
 * - Table: direct_messages
 * - Events: Insert
 * - Type: Supabase Edge Functions or HTTP Request (URL to this route)
 * - HTTP header: `x-webhook-secret: <MESSAGE_WEBHOOK_SECRET>` (same value as in env)
 */
export async function POST(request: NextRequest) {
  const secret = process.env.MESSAGE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'MESSAGE_WEBHOOK_SECRET is not set' },
      { status: 500 },
    )
  }

  const headerSecret = request.headers.get('x-webhook-secret')
  if (headerSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = (await request.json()) as WebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    payload.type !== 'INSERT' ||
    payload.table !== 'direct_messages' ||
    !payload.record
  ) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const row = payload.record
  const conversationId = row.conversation_id
  const senderId = row.sender_id
  const text = typeof row.body === 'string' ? row.body : ''

  if (!conversationId || !senderId) {
    return NextResponse.json(
      { error: 'Missing conversation_id or sender_id' },
      { status: 400 },
    )
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: conv, error: convError } = await supabase
      .from('direct_conversations')
      .select('user_low, user_high')
      .eq('id', conversationId)
      .maybeSingle()

    if (convError || !conv) {
      console.error('message-notification webhook: conversation', convError)
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 500 },
      )
    }

    const recipientId =
      conv.user_low === senderId ? conv.user_high : conv.user_low

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', senderId)
      .maybeSingle()

    const senderName =
      senderProfile?.display_name?.trim() || 'New message'
    const preview = text.trim().slice(0, 160) || 'Sent you a message'

    const push = await sendNewDirectMessagePush({
      recipientUserId: recipientId,
      title: senderName,
      body: preview,
      conversationId,
    })

    if (!push.ok) {
      console.error('OneSignal:', push.error)
    }

    return NextResponse.json({
      ok: true,
      notified: push.ok,
    })
  } catch (e) {
    console.error('message-notification webhook:', e)
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
