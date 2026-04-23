import type { Metadata } from 'next'
import { BottomNav } from '@/components/feed/BottomNav'
import { ConversationThreadClient } from '@/components/feed/ConversationThreadClient'
import { FeedHeader } from '@/components/feed/FeedHeader'
import {
  getConversationPeerProfile,
  getMessagesForConversation,
} from '@/lib/data/messages'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Props = {
  params: Promise<{ conversationId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conversationId } = await params
  if (!UUID_RE.test(conversationId)) {
    return { title: 'Chat' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { title: 'Chat' }
  const peer = await getConversationPeerProfile(conversationId, user.id)
  return {
    title: peer ? `Chat · ${peer.displayName}` : 'Chat',
  }
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  if (!UUID_RE.test(conversationId)) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const peer = await getConversationPeerProfile(conversationId, user.id)
  if (!peer) {
    notFound()
  }

  const loaded = await getMessagesForConversation(conversationId, user.id)
  if (!loaded.ok) {
    notFound()
  }

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main feed-msg-main">
        <ConversationThreadClient
          conversationId={conversationId}
          currentUserId={user.id}
          peerDisplayName={peer.displayName}
          peerUsername={peer.username}
          peerAvatarPath={peer.avatarPath}
          initialMessages={loaded.messages}
        />
      </main>
      <BottomNav />
    </div>
  )
}
