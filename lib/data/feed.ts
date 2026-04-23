import { createClient } from '@/lib/supabase/server'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import {
  isMissingPostLikesTable,
  isMissingPostSavesTable,
} from '@/lib/posts/schema-fallback'
import { formatPostTime } from '@/lib/posts/time'
import type { FeedPostData } from '@/components/feed/FeedPost'

/** When set, your own posts use this storage path if the row has no `author_avatar_path` yet. */
export type FeedViewerContext = {
  userId: string
  avatarStoragePath: string | null
}

const POSTS_SELECT_CORE =
  'id, user_id, caption, image_path, created_at, author_username, author_display_name, likes_count'
const POSTS_SELECT_BASE = `${POSTS_SELECT_CORE}, comments_count`
const POSTS_SELECT_WITH_AVATAR = `${POSTS_SELECT_BASE}, author_avatar_path`
const POSTS_SELECT_WITH_AVATAR_NO_COMMENTS = `${POSTS_SELECT_CORE}, author_avatar_path`

type FeedQueryOptions = {
  viewer?: FeedViewerContext | null
  /** When set, only posts by this user. */
  authorUserId?: string
  limit: number
}

async function queryFeedPosts(options: FeedQueryOptions): Promise<FeedPostData[]> {
  const { viewer, authorUserId, limit } = options
  const supabase = await createClient()

  const selectAttempts = [
    POSTS_SELECT_WITH_AVATAR,
    POSTS_SELECT_WITH_AVATAR_NO_COMMENTS,
    POSTS_SELECT_BASE,
    POSTS_SELECT_CORE,
  ]

  let data: Record<string, unknown>[] | null = null
  let lastError: { message: string } | null = null

  for (const sel of selectAttempts) {
    let q = supabase.from('posts').select(sel)
    if (authorUserId) {
      q = q.eq('user_id', authorUserId)
    }
    const res = await q.order('created_at', { ascending: false }).limit(limit)
    if (!res.error) {
      data = (res.data ?? []) as unknown as Record<string, unknown>[]
      break
    }
    lastError = res.error
  }

  if (!data && lastError) {
    console.error('queryFeedPosts:', lastError.message)
    return []
  }

  if (!data?.length) return []

  const postIds = data.map((r) => r.id)
  let likedIds = new Set<string>()
  let savedIds = new Set<string>()
  if (viewer?.userId && postIds.length > 0) {
    const { data: likeRows, error: likeErr } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', viewer.userId)
      .in('post_id', postIds)
    if (!likeErr && likeRows) {
      likedIds = new Set(
        likeRows.map((r) => r.post_id).filter(Boolean) as string[],
      )
    } else if (likeErr && !isMissingPostLikesTable(likeErr.message)) {
      console.error('queryFeedPosts post_likes:', likeErr.message)
    }

    const { data: saveRows, error: saveErr } = await supabase
      .from('post_saves')
      .select('post_id')
      .eq('user_id', viewer.userId)
      .in('post_id', postIds)
    if (!saveErr && saveRows) {
      savedIds = new Set(
        saveRows.map((r) => r.post_id).filter(Boolean) as string[],
      )
    } else if (saveErr && !isMissingPostSavesTable(saveErr.message)) {
      console.error('queryFeedPosts post_saves:', saveErr.message)
    }
  }

  return data.map((row, index) => {
    const id = String(row.id ?? '')
    const imagePath = String(row.image_path ?? '')
    let path =
      'author_avatar_path' in row && row.author_avatar_path
        ? String(row.author_avatar_path).trim()
        : ''
    if (
      !path &&
      viewer?.avatarStoragePath &&
      String(row.user_id) === viewer.userId
    ) {
      path = viewer.avatarStoragePath
    }
    const commentsCount =
      'comments_count' in row && typeof row.comments_count === 'number'
        ? row.comments_count
        : 0

    const caption = typeof row.caption === 'string' ? row.caption : ''
    const likesCount =
      typeof row.likes_count === 'number' ? row.likes_count : 0
    const authorUsername =
      typeof row.author_username === 'string' ? row.author_username : 'user'
    const authorDisplayName =
      typeof row.author_display_name === 'string' && row.author_display_name.trim()
        ? row.author_display_name.trim()
        : authorUsername
    const createdAt =
      typeof row.created_at === 'string' ? row.created_at : new Date().toISOString()

    return {
      id,
      username: authorUsername,
      displayName: authorDisplayName,
      imageSrc: getPostImagePublicUrl(imagePath),
      imageAlt: caption ? caption.slice(0, 120) : 'Post photo',
      likes: likesCount,
      commentsCount,
      likedByViewer: viewer?.userId ? likedIds.has(id) : false,
      savedByViewer: viewer?.userId ? savedIds.has(id) : false,
      caption,
      timeAgo: formatPostTime(createdAt),
      avatarSrc: path ? getPostImagePublicUrl(path) : undefined,
      imagePriority: index === 0,
    }
  })
}

export async function getFeedPosts(
  viewer?: FeedViewerContext | null,
): Promise<FeedPostData[]> {
  return queryFeedPosts({ viewer, limit: 100 })
}

export async function getPostsForUserId(
  authorUserId: string,
  viewer?: FeedViewerContext | null,
): Promise<FeedPostData[]> {
  return queryFeedPosts({ viewer, authorUserId, limit: 60 })
}