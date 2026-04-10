/**
 * True when the DB (or PostgREST schema cache) has no `posts.author_avatar_path` yet.
 * Postgres: "column ... does not exist". Supabase: "Could not find the 'author_avatar_path' column ... in the schema cache".
 */
export function isMissingAuthorAvatarPathColumn(message: string): boolean {
  const m = message.toLowerCase()
  if (!m.includes('author_avatar_path')) return false
  return (
    m.includes('does not exist') ||
    m.includes('unknown column') ||
    m.includes('schema cache') ||
    m.includes('could not find')
  )
}

/** Before migration `20260410140000_post_likes_and_comments.sql` is applied. */
export function isMissingCommentsCountColumn(message: string): boolean {
  const m = message.toLowerCase()
  if (!m.includes('comments_count')) return false
  return (
    m.includes('does not exist') ||
    m.includes('unknown column') ||
    m.includes('schema cache') ||
    m.includes('could not find')
  )
}

export function isMissingPostLikesTable(message: string): boolean {
  const m = message.toLowerCase()
  if (!m.includes('post_likes')) return false
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find')
  )
}

export function isMissingPostCommentsTable(message: string): boolean {
  const m = message.toLowerCase()
  if (!m.includes('post_comments')) return false
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find')
  )
}

const LIKES_COMMENTS_MIGRATION = '20260410140000_post_likes_and_comments.sql'

/** User-facing hint when likes/comments tables are missing from the remote DB. */
export function engagementSchemaErrorMessage(raw: string): string {
  if (isMissingPostLikesTable(raw) || isMissingPostCommentsTable(raw)) {
    return `Likes and comments need the latest database migration. Run ${LIKES_COMMENTS_MIGRATION} on your Supabase project (Dashboard → SQL Editor, or \`supabase db push\` from this repo), then reload the page.`
  }
  return raw
}
