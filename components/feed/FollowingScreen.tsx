import { FeedHeader } from './FeedHeader'
import { BottomNav } from './BottomNav'

export function FollowingScreen() {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <div className="activity-main">
          <h2 className="activity-title">Following</h2>
          <p className="activity-intro">People you follow will appear here.</p>
          <div className="feed-empty-state">
            <p className="feed-empty">You&apos;re not following anyone yet.</p>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
