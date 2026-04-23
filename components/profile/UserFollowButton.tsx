'use client'

import { toggleFollowAction } from '@/app/actions/follows'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

type Props = {
  targetUserId: string
  usernameForPath: string
  initialFollowing: boolean
}

export function UserFollowButton({
  targetUserId,
  usernameForPath,
  initialFollowing,
}: Props) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setFollowing(initialFollowing)
  }, [initialFollowing])

  const onClick = () => {
    setError(null)
    startTransition(async () => {
      const r = await toggleFollowAction({
        followingId: targetUserId,
        usernameForPath,
      })
      if (r.ok) {
        setFollowing(r.following)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="user-public-follow-wrap">
      <button
        type="button"
        className={
          following
            ? 'user-public-btn user-public-btn--following'
            : 'user-public-btn user-public-btn--primary'
        }
        onClick={() => void onClick()}
        disabled={pending}
      >
        {pending ? '…' : following ? 'Following' : 'Follow'}
      </button>
      {error ? (
        <p className="user-public-inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
