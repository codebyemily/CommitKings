import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SearchScreen } from '@/components/feed/SearchScreen'

export const metadata: Metadata = {
  title: 'Search',
}

export default async function SearchPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  return <SearchScreen viewerId={user.id} />
}
