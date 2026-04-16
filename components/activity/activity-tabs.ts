export const ACTIVITY_TABS = [
  { id: 'likes' as const, label: 'Liked', empty: 'No liked posts yet.' },
  { id: 'sent' as const, label: 'Sent', empty: 'No sent posts yet.' },
  { id: 'comments' as const, label: 'Commented', empty: "You haven't commented on any posts yet." },
  { id: 'saved' as const, label: 'Saved', empty: 'No saved posts yet.' },
]

export type ActivityTabId = (typeof ACTIVITY_TABS)[number]['id']

export function parseActivityTab(raw: string | undefined): ActivityTabId {
  const ids = ACTIVITY_TABS.map((t) => t.id)
  if (raw && ids.includes(raw as ActivityTabId)) {
    return raw as ActivityTabId
  }
  return 'likes'
}
