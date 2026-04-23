'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHeart, IconUserPlus } from './FeedIcons'

export function FeedHeader() {
  const pathname = usePathname()
  const requestsActive = pathname === '/follow-requests'

  return (
    <header className="feed-header">
      <h1 className="feed-logo-heading">
        <Link href="/home" className="feed-header-brand" aria-label="Forum Neighborhood home">
          Forum Neighborhood
        </Link>
      </h1>
      <div className="feed-header-actions">
        <Link
          href="/follow-requests"
          className="feed-icon-btn"
          aria-label="Friend requests"
          aria-current={requestsActive ? 'page' : undefined}
        >
          <IconUserPlus className="feed-icon-stroke" title="Friend requests" active={requestsActive} />
        </Link>
        <Link
          href="/following"
          className="feed-icon-btn"
          aria-label="Friends"
        >
          <IconHeart className="feed-icon-stroke" title="Friends" />
        </Link>
      </div>
    </header>
  )
}
