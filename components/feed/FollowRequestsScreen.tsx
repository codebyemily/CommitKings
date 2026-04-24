'use client'

import {
  acceptFollowRequestAction,
  declineFollowRequestAction,
  type FollowRequestActionResult,
} from '@/app/actions/follows'
import type { IncomingFollowRequestItem } from '@/lib/data/follows'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BottomNav } from './BottomNav'
import { FeedHeader } from './FeedHeader'

type Props = {
  items: IncomingFollowRequestItem[]
}

function rowAvatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  const url = getPostImagePublicUrl(path.trim())
  return url || null
}

export function FollowRequestsScreen({ items: initialItems }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (requesterId: string, fn: () => Promise<FollowRequestActionResult>) => {
    setError(null)
    setBusyId(requesterId)
    startTransition(async () => {
      const r = await fn()
      setBusyId(null)
      if (r.ok) {
        setItems((prev) => prev.filter((x) => x.requesterId !== requesterId))
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main activity-main">
        <h2 className="activity-title">Friend requests</h2>
        <p className="activity-intro">
          When someone sends you a friend request, they appear here. Accept to become friends
          (you can message each other); decline to dismiss.
        </p>
        {error ? (
          <p className="feed-msg-banner" role="alert">
            {error}
          </p>
        ) : null}
        {items.length === 0 ? (
          <div className="feed-empty-state">
            <p className="feed-empty">No pending friend requests.</p>
          </div>
        ) : (
          <ul className="follow-requests-list" aria-label="Pending friend requests">
            {items.map((row) => {
              const src = rowAvatarSrc(row.avatarPath)
              const initial = (row.displayName || row.username)
                .slice(0, 1)
                .toUpperCase()
              const busy = pending && busyId === row.requesterId
              return (
                <li key={row.requesterId} className="follow-requests-row">
                  <Link
                    href={`/u/${encodeURIComponent(row.username)}`}
                    className="follow-requests-user"
                  >
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
                      <span className="feed-msg-conv-name">{row.displayName}</span>
                      <span className="feed-search-hit-handle">@{row.username}</span>
                    </div>
                  </Link>
                  <div className="follow-requests-actions">
                    <button
                      type="button"
                      className="user-public-btn user-public-btn--primary follow-requests-btn"
                      disabled={busy}
                      onClick={() => {
                        void run(row.requesterId, () =>
                          acceptFollowRequestAction(row.requesterId),
                        )
                      }}
                    >
                      {busy ? '…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      className="user-public-btn user-public-btn--secondary follow-requests-btn"
                      disabled={busy}
                      onClick={() => {
                        void run(row.requesterId, () =>
                          declineFollowRequestAction(row.requesterId),
                        )
                      }}
                    >
                      {busy ? '…' : 'Decline'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
