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
