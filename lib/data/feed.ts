import { createClient } from '@/lib/supabase/server'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import { formatPostTime } from '@/lib/posts/time'
import type { FeedPostData } from '@/components/feed/FeedPost'

export async function getFeedPosts(): Promise<FeedPostData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, caption, image_path, created_at, author_username, likes_count',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('getFeedPosts:', error.message)
    return []
  }

  if (!data?.length) return []

  return data.map((row, index) => ({
    id: row.id,
    username: row.author_username,
    imageSrc: getPostImagePublicUrl(row.image_path),
    imageAlt: row.caption ? row.caption.slice(0, 120) : 'Post photo',
    likes: row.likes_count ?? 0,
    caption: row.caption ?? '',
    timeAgo: formatPostTime(row.created_at),
    avatarSrc: undefined,
    imagePriority: index === 0,
  }))
}
