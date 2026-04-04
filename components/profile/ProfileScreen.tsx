import Link from 'next/link'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { BottomNav } from '@/components/feed/BottomNav'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ProfileAppearance } from './ProfileAppearance'
import { ProfileNotificationsToggle } from './ProfileNotificationsToggle'

type ProfileScreenProps = {
  email: string
  displayName: string
  handle: string
}

const ANALYTICS_LINKS = [
  { label: 'Liked', tab: 'likes' as const },
  { label: 'Sent', tab: 'sent' as const },
  { label: 'Commented', tab: 'comments' as const },
  { label: 'Saved', tab: 'saved' as const },
] as const

export function ProfileScreen({
  email,
  displayName,
  handle,
}: ProfileScreenProps) {
  const initial = displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || '?'

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main profile-scroll">
        <section className="profile-hero">
          <div className="profile-avatar" aria-hidden>
            {initial}
          </div>
          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-handle">@{handle}</p>
          <p className="profile-bio">Tell people a little about you—this can connect to your profile later.</p>
          <button type="button" className="profile-edit-btn" disabled>
            Edit profile
          </button>
        </section>

        <section className="profile-card">
          <ProfileAppearance />
        </section>

        <section className="profile-card">
          <p className="profile-section-label">Analytics</p>
          <p className="profile-section-sub">
            View posts you&apos;ve liked, sent, commented on, or saved.
          </p>
          <ul className="profile-analytics-grid">
            {ANALYTICS_LINKS.map(({ label, tab }) => (
              <li key={tab} className="profile-analytics-cell-wrap">
                <Link
                  href={`/activity?tab=${tab}`}
                  className="profile-analytics-link"
                >
                  <span className="profile-analytics-link-label">{label}</span>
                  <span className="profile-analytics-link-hint">View list</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="profile-card">
          <p className="profile-section-label">Notifications</p>
          <ProfileNotificationsToggle />
        </section>

        <section className="profile-card">
          <p className="profile-section-label">Account</p>
          <div className="profile-row profile-row-static">
            <div>
              <p className="profile-row-title">Email</p>
              <p className="profile-row-value">{email}</p>
            </div>
          </div>
          <Link className="profile-link-row" href="/forgot-password">
            Change password
          </Link>
        </section>

        <section className="profile-card profile-card-signout">
          <SignOutButton className="profile-signout-btn" />
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
