import Link from 'next/link'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { BottomNav } from '@/components/feed/BottomNav'
import { ACTIVITY_TABS, type ActivityTabId } from './activity-tabs'

type ActivityScreenProps = {
  tab: ActivityTabId
}

export function ActivityScreen({ tab }: ActivityScreenProps) {
  const panel = ACTIVITY_TABS.find((t) => t.id === tab) ?? ACTIVITY_TABS[0]

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main activity-main">
        <h2 className="activity-title">Your activity</h2>
        <p className="activity-intro">
          Posts you&apos;ve liked, sent, commented on, and saved will appear here once connected
          to your backend.
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
          <p className="activity-panel-empty">{panel.empty}</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
