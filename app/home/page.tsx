import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HomeFeed } from '@/components/feed/HomeFeed'
import { getFeedPosts } from '@/lib/data/feed'

export const metadata: Metadata = {
  title: 'Home',
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata as Record<string, unknown>
  const avatarPathRaw =
    (typeof profile?.avatar_path === 'string' && profile.avatar_path.trim()) ||
    (typeof meta?.avatar_path === 'string' ? meta.avatar_path.trim() : '')
  const posts = await getFeedPosts({
    userId: user.id,
    avatarStoragePath: avatarPathRaw || null,
  })

  return <HomeFeed posts={posts} />
}
