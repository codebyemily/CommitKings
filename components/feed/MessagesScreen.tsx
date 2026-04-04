import { FeedHeader } from './FeedHeader'
import { BottomNav } from './BottomNav'

export function MessagesScreen() {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <div className="feed-empty-state">
          <p className="feed-empty">No conversations yet.</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
