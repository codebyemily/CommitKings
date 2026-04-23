/** Public URL for an object in the `post-images` bucket. */
export function getPostImagePublicUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!base?.trim()) {
    return ''
  }

  const trimmed = typeof imagePath === 'string' ? imagePath.trim() : ''
  if (!trimmed) {
    return ''
  }

  const encoded = trimmed
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${base}/storage/v1/object/public/post-images/${encoded}`
}
