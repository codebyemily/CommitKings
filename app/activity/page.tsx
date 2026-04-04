import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivityScreen } from '@/components/activity/ActivityScreen'
import { parseActivityTab } from '@/components/activity/activity-tabs'

export const metadata: Metadata = {
  title: 'Your activity',
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const tab = parseActivityTab(params.tab)

  return <ActivityScreen tab={tab} />
}
