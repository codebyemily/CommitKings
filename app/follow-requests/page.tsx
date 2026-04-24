import { FollowRequestsScreen } from '@/components/feed/FollowRequestsScreen'
import { createClient } from '@/lib/supabase/server'
import { getIncomingFollowRequests } from '@/lib/data/follows'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Friend requests',
}

export default async function FollowRequestsPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  const items = await getIncomingFollowRequests(user.id)

  return (
    <FollowRequestsScreen
      key={items.map((i) => i.requesterId).join('-')}
      items={items}
    />
  )
}
