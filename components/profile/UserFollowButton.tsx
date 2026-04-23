'use client'

import { toggleFollowAction } from '@/app/actions/follows'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Props = {
  targetUserId: string
  usernameForPath: string
  initialFriends: boolean
  initialOutgoingRequest: boolean
}

export function UserFollowButton({
  targetUserId,
  usernameForPath,
  initialFriends,
  initialOutgoingRequest,
}: Props) {
  const router = useRouter()
  const [friends, setFriends] = useState(initialFriends)
  const [outgoingRequest, setOutgoingRequest] = useState(initialOutgoingRequest)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    setError(null)
    startTransition(async () => {
      const r = await toggleFollowAction({
        followingId: targetUserId,
        usernameForPath,
      })
      if (r.ok) {
        setFriends(r.friends)
        setOutgoingRequest(r.outgoingRequest)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  const label = pending
    ? '…'
    : friends
      ? 'Friends'
      : outgoingRequest
        ? 'Request sent'
        : 'Add friend'

  const btnClass = friends
    ? 'user-public-btn user-public-btn--friends'
    : outgoingRequest
      ? 'user-public-btn user-public-btn--requested'
      : 'user-public-btn user-public-btn--primary'

  return (
    <div className="user-public-follow-wrap">
      <button
        type="button"
        className={btnClass}
        onClick={() => void onClick()}
        disabled={pending || friends}
        title={friends ? 'You are friends' : undefined}
      >
        {label}
      </button>
      {error ? (
        <p className="user-public-inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
