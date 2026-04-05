import Link from 'next/link'
import { IconHeart } from './FeedIcons'

export function FeedHeader() {
  return (
    <header className="feed-header">
      <h1 className="feed-logo">Forum Neighborhood</h1>
      <div className="feed-header-actions">
        <Link
          href="/following"
          className="feed-icon-btn feed-notifications"
          aria-label="Following list and activity, 2 unread"
        >
          <IconHeart className="feed-icon-stroke" title="Following" />
          <span className="feed-notify-badge" aria-hidden>
            2
          </span>
        </Link>
      </div>
    </header>
  )
}
