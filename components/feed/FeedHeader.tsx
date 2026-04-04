import { IconHeart } from './FeedIcons'

export function FeedHeader() {
  return (
    <header className="feed-header">
      <h1 className="feed-logo">Forum Neighborhood</h1>
      <div className="feed-header-actions">
        <button
          type="button"
          className="feed-icon-btn feed-notifications"
          aria-label="Notifications, 2 unread"
        >
          <IconHeart className="feed-icon-stroke" title="Activity" />
          <span className="feed-notify-badge" aria-hidden>
            2
          </span>
        </button>
      </div>
    </header>
  )
}
