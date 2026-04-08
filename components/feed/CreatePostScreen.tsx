import { FeedHeader } from './FeedHeader'
import { BottomNav } from './BottomNav'
import { CreatePostForm } from './CreatePostForm'

export function CreatePostScreen() {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main create-post-main">
        <div className="activity-main">
          <h2 className="activity-title">New post</h2>
          <p className="activity-intro">
            Add an image, then share when your upload API is ready.
          </p>
        </div>
        <CreatePostForm />
      </main>
      <BottomNav />
    </div>
  )
}
