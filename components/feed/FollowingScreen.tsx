import type { FollowingListItem } from '@/lib/data/follows'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import Image from 'next/image'
import Link from 'next/link'
import { BottomNav } from './BottomNav'
import { FeedHeader } from './FeedHeader'

type Props = {
  items: FollowingListItem[]
}

function rowAvatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  try {
    return getPostImagePublicUrl(path.trim())
  } catch {
    return null
  }
}

export function FollowingScreen({ items }: Props) {
  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <div className="activity-main">
          <h2 className="activity-title">Following</h2>
          <p className="activity-intro">
            People you follow. Tap a name to open their profile.
          </p>
          {items.length === 0 ? (
            <div className="feed-empty-state">
              <p className="feed-empty">You&apos;re not following anyone yet.</p>
            </div>
          ) : (
            <ul className="feed-search-results" aria-label="People you follow">
              {items.map((p) => {
                const src = rowAvatarSrc(p.avatarPath)
                const initial = (p.displayName || p.username)
                  .slice(0, 1)
                  .toUpperCase()
                return (
                  <li key={p.id}>
                    <Link
                      href={`/u/${encodeURIComponent(p.username)}`}
                      className="feed-search-hit-row"
                    >
                      <div className="feed-msg-conv-avatar-wrap">
                        {src ? (
                          <Image
                            src={src}
                            alt=""
                            width={48}
                            height={48}
                            className="feed-avatar feed-msg-conv-avatar"
                            unoptimized
                          />
                        ) : (
                          <span className="feed-avatar-fallback feed-msg-conv-avatar-fallback">
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="feed-msg-conv-body">
                        <div className="feed-msg-conv-top">
                          <span className="feed-msg-conv-name">{p.displayName}</span>
                        </div>
                        <p className="feed-search-hit-handle">@{p.username}</p>
                        <p className="feed-search-hit-action">View profile</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
