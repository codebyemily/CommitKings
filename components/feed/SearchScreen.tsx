import { FeedHeader } from './FeedHeader'
import { BottomNav } from './BottomNav'

export function SearchScreen() {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <div className="feed-search-wrap">
          <label className="sr-only" htmlFor="feed-search">
            Search users and posts
          </label>
          <input
            id="feed-search"
            name="q"
            type="search"
            className="feed-search-input"
            placeholder="Search users and posts"
            autoComplete="off"
            enterKeyHint="search"
          />
          <p className="feed-search-hint">No posts searched.</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
