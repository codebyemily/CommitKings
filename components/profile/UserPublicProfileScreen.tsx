import { FeedPost, type FeedPostData } from '@/components/feed/FeedPost'
import type { PublicProfile } from '@/lib/data/profile-public'
import { BottomNav } from '@/components/feed/BottomNav'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { UserFollowButton } from '@/components/profile/UserFollowButton'
import { UserRemoveFriendButton } from '@/components/profile/UserRemoveFriendButton'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  profile: PublicProfile
  posts: FeedPostData[]
  viewerId: string
  initialFriends: boolean
  initialOutgoingRequest: boolean
  pathUsername: string
  friendsCount: number
}

export function UserPublicProfileScreen({
  profile,
  posts,
  viewerId,
  initialFriends,
  initialOutgoingRequest,
  pathUsername,
  friendsCount,
}: Props) {
  const isOwn = profile.id === viewerId
  const initial =
    profile.displayName.charAt(0).toUpperCase() ||
    profile.username.charAt(0).toUpperCase() ||
    '?'
  const avatarUrl = profile.avatarPath
    ? getPostImagePublicUrl(profile.avatarPath)
    : null
  const bioText = profile.bio.trim()
  const messageHref = `/messages?with=${encodeURIComponent(profile.username)}`

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main profile-scroll">
        <section className="user-public-hero">
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
          <h1 className="profile-name">{profile.displayName}</h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-friends-count" aria-label="Friends">
            <span className="profile-friends-count-num">{friendsCount}</span>
            <span className="profile-friends-count-label">
              {friendsCount === 1 ? 'friend' : 'friends'}
            </span>
          </p>
          <p className="user-public-bio">
            {bioText
              ? bioText
              : isOwn
                ? 'No bio yet — add one from Edit profile.'
                : 'No bio yet.'}
          </p>

          {isOwn ? (
            <Link href="/profile" className="user-public-btn user-public-btn--primary">
              Edit profile
            </Link>
          ) : (
            <div className="user-public-actions">
              <UserFollowButton
                key={`${profile.id}-${initialFriends}-${initialOutgoingRequest}`}
                targetUserId={profile.id}
                usernameForPath={pathUsername}
                initialFriends={initialFriends}
                initialOutgoingRequest={initialOutgoingRequest}
              />
              <Link
                href={messageHref}
                className="user-public-btn user-public-btn--secondary"
              >
                Message
              </Link>
              {initialFriends ? (
                <UserRemoveFriendButton
                  key={`remove-${profile.id}`}
                  otherUserId={profile.id}
                  usernameForPath={pathUsername}
                />
              ) : null}
            </div>
          )}
        </section>

        <section className="user-public-posts">
          <h2 className="user-public-posts-title">Posts</h2>
          {posts.length === 0 ? (
            <div className="feed-empty-state">
              <p className="feed-empty">
                {isOwn
                  ? 'You have not posted anything yet.'
                  : 'No posts yet.'}
              </p>
            </div>
          ) : (
            posts.map((post) => <FeedPost key={post.id} {...post} />)
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
