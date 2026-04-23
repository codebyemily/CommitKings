'use client'

import { unfriendUserAction } from '@/app/actions/follows'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Props = {
  otherUserId: string
  usernameForPath: string
}

export function UserRemoveFriendButton({ otherUserId, usernameForPath }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onRemove = () => {
    setError(null)
    startTransition(async () => {
      const r = await unfriendUserAction({
        otherUserId,
        usernameForPath,
      })
      if (r.ok) {
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
        className="user-public-btn user-public-btn--friends"
        disabled={pending}
        onClick={() => void onRemove()}
      >
        {pending ? '…' : 'Remove friend'}
      </button>
      {error ? (
        <p className="user-public-inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
