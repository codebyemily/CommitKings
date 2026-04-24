import type { FriendListItem } from '@/lib/data/follows'
import { BottomNav } from './BottomNav'
import { FeedHeader } from './FeedHeader'
import { FollowingListRow } from './FollowingListRow'

type Props = {
  items: FriendListItem[]
}

export function FollowingScreen({ items }: Props) {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <div className="activity-main">
          <h2 className="activity-title">Friends</h2>
          <p className="activity-intro">
            People who accepted your friend request (or you accepted theirs). Remove friend ends
            the friendship for both of you.
          </p>
          {items.length === 0 ? (
            <div className="feed-empty-state">
              <p className="feed-empty">No friends yet. Send a friend request from someone&apos;s profile.</p>
            </div>
          ) : (
            <ul className="following-list" aria-label="Your friends">
              {items.map((p) => (
                <FollowingListRow key={p.id} person={p} />
              ))}
            </ul>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
