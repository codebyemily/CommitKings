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
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const posts = await getFeedPosts()

  return <HomeFeed posts={posts} />
}
