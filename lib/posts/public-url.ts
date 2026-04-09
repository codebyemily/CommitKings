/** Public URL for an object in the `post-images` bucket. */
export function getPostImagePublicUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  const encoded = imagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${base}/storage/v1/object/public/post-images/${encoded}`
}
