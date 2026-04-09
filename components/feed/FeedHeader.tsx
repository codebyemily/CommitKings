import Link from 'next/link'
import { IconHeart } from './FeedIcons'

export function FeedHeader() {
  return (
    <header className="feed-header">
      <h1 className="feed-logo">Forum Neighborhood</h1>
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
