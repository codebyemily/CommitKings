import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreatePostScreen } from '@/components/feed/CreatePostScreen'

export const metadata: Metadata = {
  title: 'New post',
}

export default async function CreatePostPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  return <CreatePostScreen />
}
