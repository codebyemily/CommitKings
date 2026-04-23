'use client'

import { unfriendUserAction } from '@/app/actions/follows'
import type { FriendListItem } from '@/lib/data/follows'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Props = {
  person: FriendListItem
}

function rowAvatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  const url = getPostImagePublicUrl(path.trim())
  return url || null
}

export function FollowingListRow({ person }: Props) {
  const router = useRouter()
  const [removed, setRemoved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (removed) {
    return null
  }

  const src = rowAvatarSrc(person.avatarPath)
  const initial = (person.displayName || person.username).slice(0, 1).toUpperCase()
  const profileHref = `/u/${encodeURIComponent(person.username)}`

  const onRemove = () => {
    setError(null)
    startTransition(async () => {
      const r = await unfriendUserAction({
        otherUserId: person.id,
        usernameForPath: person.username,
      })
      if (r.ok) {
        setRemoved(true)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <li className="following-list-row">
      <Link href={profileHref} className="following-list-main">
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
            <span className="feed-msg-conv-name">{person.displayName}</span>
          </div>
          <p className="feed-search-hit-handle">@{person.username}</p>
          <p className="feed-search-hit-action">View profile</p>
        </div>
      </Link>
      <div className="following-list-actions">
        {error ? (
          <p className="user-public-inline-error following-list-row-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="user-public-btn user-public-btn--friends following-list-unfriend"
          disabled={pending}
          onClick={() => void onRemove()}
        >
          {pending ? '…' : 'Remove friend'}
        </button>
      </div>
    </li>
  )
}
