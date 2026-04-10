import { createClient } from '@/lib/supabase/server'
import { decodeSharedPostMessage } from '@/lib/messages/share'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import type { ActivityTabId } from '@/components/activity/activity-tabs'

export type ActivityPostItem = {
  postId: string
  authorUsername: string
  caption: string
  imageSrc: string
  activityAt: string
}

type PostRow = {
  id: string
  author_username: string
  caption: string
  image_path: string
}

function mapPostRows(rows: PostRow[] | null): Map<string, PostRow> {
  return new Map((rows ?? []).map((row) => [row.id, row]))
}

export async function getActivityPostsForTab(
  userId: string,
  tab: ActivityTabId,
): Promise<ActivityPostItem[]> {
  const supabase = await createClient()

  if (tab === 'likes') {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)

    if (!likes?.length) return []
    const postIds = likes.map((row) => row.post_id)
    const { data: posts } = await supabase
      .from('posts')
      .select('id, author_username, caption, image_path')
      .in('id', postIds)
    const postById = mapPostRows(posts as PostRow[] | null)
    return likes
      .map((row) => {
        const post = postById.get(row.post_id)
        if (!post) return null
        return {
          postId: post.id,
          authorUsername: post.author_username || 'user',
          caption: post.caption || '',
          imageSrc: getPostImagePublicUrl(post.image_path),
          activityAt: row.created_at,
        } satisfies ActivityPostItem
      })
      .filter(Boolean) as ActivityPostItem[]
  }

  if (tab === 'saved') {
    const { data: saves } = await supabase
      .from('post_saves')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)

    if (!saves?.length) return []
    const postIds = saves.map((row) => row.post_id)
    const { data: posts } = await supabase
      .from('posts')
      .select('id, author_username, caption, image_path')
      .in('id', postIds)
    const postById = mapPostRows(posts as PostRow[] | null)
    return saves
      .map((row) => {
        const post = postById.get(row.post_id)
        if (!post) return null
        return {
          postId: post.id,
          authorUsername: post.author_username || 'user',
          caption: post.caption || '',
          imageSrc: getPostImagePublicUrl(post.image_path),
          activityAt: row.created_at,
        } satisfies ActivityPostItem
      })
      .filter(Boolean) as ActivityPostItem[]
  }

  if (tab === 'comments') {
    const { data: comments } = await supabase
      .from('post_comments')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)

    if (!comments?.length) return []
    const postIds = Array.from(new Set(comments.map((row) => row.post_id)))
    const { data: posts } = await supabase
      .from('posts')
      .select('id, author_username, caption, image_path')
      .in('id', postIds)
    const postById = mapPostRows(posts as PostRow[] | null)
    return comments
      .map((row) => {
        const post = postById.get(row.post_id)
        if (!post) return null
        return {
          postId: post.id,
          authorUsername: post.author_username || 'user',
          caption: post.caption || '',
          imageSrc: getPostImagePublicUrl(post.image_path),
          activityAt: row.created_at,
        } satisfies ActivityPostItem
      })
      .filter(Boolean) as ActivityPostItem[]
  }

  const { data: sent } = await supabase
    .from('direct_messages')
    .select('id, body, created_at')
    .eq('sender_id', userId)
    .like('body', '[shared_post]%')
    .order('created_at', { ascending: false })
    .limit(120)

  return (sent ?? [])
    .map((row) => {
      const parsed = decodeSharedPostMessage(row.body)
      if (!parsed) return null
      return {
        postId: parsed.postId,
        authorUsername: parsed.authorUsername || 'user',
        caption: parsed.caption || '',
        imageSrc: parsed.imageSrc,
        activityAt: row.created_at,
      } satisfies ActivityPostItem
    })
    .filter(Boolean) as ActivityPostItem[]
}
