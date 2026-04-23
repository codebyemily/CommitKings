import { UserPublicProfileScreen } from '@/components/profile/UserPublicProfileScreen'
import { createClient } from '@/lib/supabase/server'
import {
  getMutualFriendsCount,
  viewerFriendsWithUser,
  viewerOutgoingFollowRequest,
} from '@/lib/data/follows'
import { getPostsForUserId } from '@/lib/data/feed'
import { getPublicProfileByUsername } from '@/lib/data/profile-public'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: raw } = await params
  const handle = decodeURIComponent(raw).trim().replace(/^@+/, '')
  const profile = handle ? await getPublicProfileByUsername(handle) : null
  if (!profile) {
    return { title: 'Profile' }
  }
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description: profile.bio.trim() || `Posts by @${profile.username} on Forum Neighborhood.`,
  }
}

export default async function PublicUserProfilePage({ params }: Props) {
  const { username: raw } = await params
  const pathUsername = decodeURIComponent(raw).trim()
  const handle = pathUsername.replace(/^@+/, '')

  if (!handle) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getPublicProfileByUsername(handle)
  if (!profile) {
    notFound()
  }

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata as Record<string, unknown>
  const avatarPathRaw =
    (typeof viewerProfile?.avatar_path === 'string' &&
      viewerProfile.avatar_path.trim()) ||
    (typeof meta?.avatar_path === 'string' ? meta.avatar_path.trim() : '')

  const posts = await getPostsForUserId(profile.id, {
    userId: user.id,
    avatarStoragePath: avatarPathRaw || null,
  })

  const initialFriends =
    profile.id === user.id
      ? false
      : await viewerFriendsWithUser(user.id, profile.id)

  const initialOutgoingRequest =
    profile.id === user.id
      ? false
      : await viewerOutgoingFollowRequest(user.id, profile.id)

  const friendsCount = await getMutualFriendsCount(profile.id)

  return (
    <UserPublicProfileScreen
      profile={profile}
      posts={posts}
      viewerId={user.id}
      initialFriends={initialFriends}
      initialOutgoingRequest={initialOutgoingRequest}
      pathUsername={pathUsername}
      friendsCount={friendsCount}
    />
  )
}
