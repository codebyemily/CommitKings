import { FeedHeader } from './FeedHeader'
import { BottomNav } from './BottomNav'
import { FeedPost, type FeedPostData } from './FeedPost'

type HomeFeedProps = {
  posts: FeedPostData[]
}

export function HomeFeed({ posts }: HomeFeedProps) {
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
