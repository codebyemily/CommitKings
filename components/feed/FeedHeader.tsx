import { SiteLogo } from '@/components/brand/SiteLogo'
import Link from 'next/link'
import { IconHeart } from './FeedIcons'

export function FeedHeader() {
  return (
    <header className="feed-header">
      <h1 className="feed-logo-heading">
        <Link href="/home" className="feed-logo-link" aria-label="Forum Neighborhood home">
          <SiteLogo variant="header" />
        </Link>
      </h1>
      <div className="feed-header-actions">
        <Link
          href="/following"
          className="feed-icon-btn"
          aria-label="Following"
        >
          <IconHeart className="feed-icon-stroke" title="Following" />
        </Link>
      </div>
    </header>
  )
}
