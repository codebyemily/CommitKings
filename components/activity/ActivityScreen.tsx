import Link from 'next/link'
import Image from 'next/image'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { BottomNav } from '@/components/feed/BottomNav'
import { ACTIVITY_TABS, type ActivityTabId } from './activity-tabs'
import type { ActivityPostItem } from '@/lib/data/activity'

type ActivityScreenProps = {
  tab: ActivityTabId
  items: ActivityPostItem[]
}

export function ActivityScreen({ tab, items }: ActivityScreenProps) {
  const panel = ACTIVITY_TABS.find((t) => t.id === tab) ?? ACTIVITY_TABS[0]

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main activity-main">
        <h2 className="activity-title">Your activity</h2>
        <p className="activity-intro">
          Posts you&apos;ve liked, sent, commented on, and saved appear here.
        </p>
        <nav className="activity-tabs" aria-label="Activity type">
          {ACTIVITY_TABS.map(({ id, label }) => {
            const active = tab === id
            return (
              <Link
                key={id}
                href={`/activity?tab=${id}`}
                className={`activity-tab${active ? ' activity-tab-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="activity-panel">
          {items.length === 0 ? (
            <p className="activity-panel-empty">{panel.empty}</p>
          ) : (
            <ul className="activity-post-list" aria-label={`${panel.label} posts`}>
              {items.map((item) => (
                <li key={`${item.postId}-${item.activityAt}`} className="activity-post-row">
                  {item.imageSrc ? (
                    <Image
                      src={item.imageSrc}
                      alt={item.caption ? item.caption.slice(0, 120) : 'Post'}
                      width={56}
                      height={56}
                      className="activity-post-thumb"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="activity-post-thumb activity-post-thumb-placeholder"
                      role="img"
                      aria-label={item.caption ? item.caption.slice(0, 120) : 'Post'}
                    />
                  )}
                  <div className="activity-post-copy">
                    <p className="activity-post-caption">
                      <span className="activity-post-user">@{item.authorUsername}</span>{' '}
                      {item.caption}
                    </p>
                    <time className="activity-post-time" dateTime={item.activityAt}>
                      {new Date(item.activityAt).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
