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
            Add a photo and caption—your post will show on everyone&apos;s home feed.
          </p>
        </div>
        <CreatePostForm />
      </main>
      <BottomNav />
    </div>
  )
}
