'use client'

import { createClient } from '@/lib/supabase/client'
import type { DirectMessageRow } from '@/lib/messages/types'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  conversationId: string
  currentUserId: string
  peerDisplayName: string
  peerAvatarPath: string | null
  initialMessages: DirectMessageRow[]
}

function avatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  try {
    return getPostImagePublicUrl(path.trim())
  } catch {
    return null
  }
}

function formatMsgTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function ConversationThreadClient({
  conversationId,
  currentUserId,
  peerDisplayName,
  peerAvatarPath,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<DirectMessageRow[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as DirectMessageRow
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            const next = [...prev, row]
            next.sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )
            return next
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId])

  const sendMessage = async () => {
    const text = body.trim()
    if (!text || sending) return
    setSendError(null)
    setSending(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: text,
      })
      .select('id, conversation_id, sender_id, body, created_at')
      .single()

    setSending(false)
    if (error) {
      setSendError(error.message)
      return
    }
    if (data) {
      setBody('')
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data as DirectMessageRow]
      })
    }
  }

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage()
  }

  const peerSrc = avatarSrc(peerAvatarPath)
  const peerInitial = peerDisplayName.slice(0, 1).toUpperCase()

  return (
    <div className="feed-msg-thread">
      <header className="feed-msg-thread-head">
        <Link href="/messages" className="feed-msg-back">
          ← Messages
        </Link>
        <div className="feed-msg-thread-peer">
          {peerSrc ? (
            <Image
              src={peerSrc}
              alt=""
              width={36}
              height={36}
              className="feed-avatar feed-msg-thread-avatar"
              unoptimized
            />
          ) : (
            <span className="feed-avatar-fallback feed-msg-thread-avatar-fallback">
              {peerInitial}
            </span>
          )}
          <span className="feed-msg-thread-name">{peerDisplayName}</span>
        </div>
      </header>

      <div className="feed-msg-scroll" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p className="feed-msg-empty">No messages yet. Say hello.</p>
        ) : (
          <ul className="feed-msg-bubbles">
            {messages.map((m) => {
              const mine = m.sender_id === currentUserId
              return (
                <li
                  key={m.id}
                  className={mine ? 'feed-msg-row feed-msg-row-mine' : 'feed-msg-row'}
                >
                  <div className={mine ? 'feed-msg-bubble feed-msg-bubble-mine' : 'feed-msg-bubble'}>
                    <p className="feed-msg-text">{m.body}</p>
                    <time className="feed-msg-meta" dateTime={m.created_at}>
                      {formatMsgTime(m.created_at)}
                    </time>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="feed-msg-composer" onSubmit={onSubmitForm}>
        {sendError ? (
          <p className="feed-msg-banner" role="alert">
            {sendError}
          </p>
        ) : null}
        <div className="feed-msg-composer-row">
          <label className="sr-only" htmlFor="msg-body">
            Message
          </label>
          <textarea
            id="msg-body"
            name="body"
            className="feed-msg-input"
            placeholder="Message…"
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            disabled={sending}
            maxLength={4000}
          />
          <button type="submit" className="feed-msg-send" disabled={sending || !body.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
