import { createClient } from '@/lib/supabase/server'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import { isMissingAuthorAvatarPathColumn } from '@/lib/posts/schema-fallback'
import { formatPostTime } from '@/lib/posts/time'
import type { FeedPostData } from '@/components/feed/FeedPost'

const POSTS_SELECT_BASE =
  'id, caption, image_path, created_at, author_username, likes_count'
const POSTS_SELECT_WITH_AVATAR = `${POSTS_SELECT_BASE}, author_avatar_path`

export async function getFeedPosts(): Promise<FeedPostData[]> {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('posts')
    .select(POSTS_SELECT_WITH_AVATAR)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error && isMissingAuthorAvatarPathColumn(error.message)) {
    const retry = await supabase
      .from('posts')
      .select(POSTS_SELECT_BASE)
      .order('created_at', { ascending: false })
      .limit(100)
    data = retry.data as typeof data
    error = retry.error
  }

  if (error) {
    console.error('getFeedPosts:', error.message)
    return []
  }

  if (!data?.length) return []

  return data.map((row, index) => {
    const path =
      'author_avatar_path' in row && row.author_avatar_path
        ? String(row.author_avatar_path).trim()
        : ''
    return {
      id: row.id,
      username: row.author_username,
      imageSrc: getPostImagePublicUrl(row.image_path),
      imageAlt: row.caption ? row.caption.slice(0, 120) : 'Post photo',
      likes: row.likes_count ?? 0,
      caption: row.caption ?? '',
      timeAgo: formatPostTime(row.created_at),
      avatarSrc: path ? getPostImagePublicUrl(path) : undefined,
      imagePriority: index === 0,
    }
  })
}
