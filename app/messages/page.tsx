import type { Metadata } from 'next'
import { openConversationByUsername } from '@/app/actions/messages'
import { BottomNav } from '@/components/feed/BottomNav'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { MessagesListClient } from '@/components/feed/MessagesListClient'
import { getConversationsForUser } from '@/lib/data/messages'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Messages',
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const sp = await searchParams
  let withError: string | null = null
  if (sp.with?.trim()) {
    const r = await openConversationByUsername(sp.with.trim())
    if (r.ok) {
      redirect(`/messages/${r.conversationId}`)
    }
    withError = r.error
  }

  const conversations = await getConversationsForUser(user.id)

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <MessagesListClient
          initialConversations={conversations}
          withError={withError}
        />
      </main>
      <BottomNav />
    </div>
  )
}
