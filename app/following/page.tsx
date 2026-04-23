import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FollowingScreen } from '@/components/feed/FollowingScreen'
import { getFriendsList } from '@/lib/data/follows'

export const metadata: Metadata = {
  title: 'Friends',
}

export default async function FollowingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const friends = await getFriendsList(user.id)

  return <FollowingScreen items={friends} />
}
