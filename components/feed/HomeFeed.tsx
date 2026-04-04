import { FeedHeader } from './FeedHeader'
import { BottomNav } from './BottomNav'
import { FeedPost, type FeedPostData } from './FeedPost'

/** Populated from your backend when real posts exist. */
const posts: FeedPostData[] = []

export function HomeFeed() {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        {posts.length === 0 ? (
          <div className="feed-empty-state">
            <p className="feed-empty">No posts currently available.</p>
          </div>
        ) : (
          posts.map((post) => <FeedPost key={post.id} {...post} />)
        )}
      </main>
      <BottomNav />
    </div>
  )
}
