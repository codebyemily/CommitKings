import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FollowingScreen } from '@/components/feed/FollowingScreen'

export const metadata: Metadata = {
  title: 'Following',
}

export default async function FollowingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <FollowingScreen />
}
