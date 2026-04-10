'use client'

import {
  openConversationByUsername,
} from '@/app/actions/messages'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import type { ConversationListItem } from '@/lib/data/messages'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Props = {
  initialConversations: ConversationListItem[]
  withError: string | null
}

function peerAvatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  try {
    return getPostImagePublicUrl(path.trim())
  } catch {
    return null
  }
}

function formatListTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function MessagesListClient({
  initialConversations,
  withError,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmitByUsername = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const u = username.trim()
    if (!u) {
      setFormError('Enter a username.')
      return
    }
    startTransition(async () => {
      const r = await openConversationByUsername(u)
      if (r.ok) {
        router.push(`/messages/${r.conversationId}`)
      } else {
        setFormError(r.error)
      }
    })
  }

  return (
    <>
      <div className="feed-msg-start">
        <p className="feed-msg-start-title">New message</p>
        <form className="feed-msg-start-form" onSubmit={onSubmitByUsername}>
          <label className="sr-only" htmlFor="msg-username">
            Username
          </label>
          <input
            id="msg-username"
            name="username"
            type="text"
            className="feed-search-input"
            placeholder="Username (e.g. alex)"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
          />
          <button type="submit" className="feed-msg-btn-primary" disabled={pending}>
            {pending ? 'Opening…' : 'Start chat'}
          </button>
        </form>
      </div>

      {(withError || formError) && (
        <p className="feed-msg-banner" role="alert">
          {formError ?? withError}
        </p>
      )}

      {initialConversations.length === 0 ? (
        <div className="feed-empty-state">
          <p className="feed-empty">No conversations yet. Start one above.</p>
        </div>
      ) : (
        <ul className="feed-msg-conv-list" aria-label="Conversations">
          {initialConversations.map((c) => {
            const src = peerAvatarSrc(c.peerAvatarPath)
            const initial = (c.peerDisplayName || c.peerUsername).slice(0, 1).toUpperCase()
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="feed-msg-conv-row">
                  <div className="feed-msg-conv-avatar-wrap">
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        width={48}
                        height={48}
                        className="feed-avatar feed-msg-conv-avatar"
                        unoptimized
                      />
                    ) : (
                      <span className="feed-avatar-fallback feed-msg-conv-avatar-fallback">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="feed-msg-conv-body">
                    <div className="feed-msg-conv-top">
                      <span className="feed-msg-conv-name">{c.peerDisplayName}</span>
                      <span className="feed-msg-conv-time">
                        {formatListTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="feed-msg-conv-preview">
                      {c.lastMessagePreview ?? 'Say hello'}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
