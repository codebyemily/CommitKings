import Image from 'next/image'
import Link from 'next/link'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { BottomNav } from '@/components/feed/BottomNav'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ProfileAppearance } from './ProfileAppearance'
import { ProfileEditButton } from './ProfileEditButton'

type ProfileScreenProps = {
  email: string
  displayName: string
  handle: string
  bio: string
  avatarUrl: string | null
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
  bio,
  avatarUrl,
}: ProfileScreenProps) {
  const initial = displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || '?'
  const bioText = bio.trim()

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main profile-scroll">
        <section className="profile-hero">
          <div
            className={
              avatarUrl ? 'profile-avatar profile-avatar--photo' : 'profile-avatar'
            }
            aria-hidden
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={88}
                height={88}
                className="profile-avatar-image"
                priority
              />
            ) : (
              <span className="profile-avatar-letter">{initial}</span>
            )}
          </div>
          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-handle">@{handle}</p>
          <p className="profile-bio">
            {bioText
              ? bioText
              : 'Add a short bio—tap Edit profile to tell people about you.'}
          </p>
          <ProfileEditButton
            initialDisplayName={displayName}
            initialUsername={handle}
            initialBio={bio}
            initialAvatarUrl={avatarUrl}
          />
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
