import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import { redirect } from 'next/navigation'
import { ProfileScreen } from '@/components/profile/ProfileScreen'

export const metadata: Metadata = {
  title: 'Profile',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const meta = user.user_metadata as Record<string, unknown>
  const displayName =
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.username === 'string' && meta.username.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    user.email?.split('@')[0] ||
    'Member'

  const handle =
    (typeof meta?.username === 'string' && meta.username.trim().replace(/^@/, '')) ||
    user.email?.split('@')[0] ||
    'user'

  const bio = typeof meta?.bio === 'string' ? meta.bio : ''

  const avatarPathRaw =
    typeof meta?.avatar_path === 'string' ? meta.avatar_path.trim() : ''
  const avatarUrl = avatarPathRaw ? getPostImagePublicUrl(avatarPathRaw) : null

  return (
    <ProfileScreen
      email={user.email ?? ''}
      displayName={displayName}
      handle={handle}
      bio={bio}
      avatarUrl={avatarUrl}
    />
  )
}
