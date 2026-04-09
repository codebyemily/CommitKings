'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export type CreatePostResult =
  | { ok: true }
  | { ok: false; error: string }

export async function createPostAction(formData: FormData): Promise<CreatePostResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in to post.' }
  }

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Please add a photo.' }
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Image must be 10 MB or smaller.' }
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: 'Use a JPEG, PNG, WebP, or GIF image.' }
  }

  const caption = String(formData.get('caption') ?? '').slice(0, 2200)

  const meta = user.user_metadata as Record<string, unknown>
  const username =
    (typeof meta?.username === 'string' && meta.username.trim()) ||
    user.email?.split('@')[0] ||
    'user'
  const displayName =
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    username

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg'

  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    return { ok: false, error: uploadError.message }
  }

  const { error: insertError } = await supabase.from('posts').insert({
    user_id: user.id,
    image_path: path,
    caption,
    author_username: username,
    author_display_name: displayName,
  })

  if (insertError) {
    await supabase.storage.from('post-images').remove([path])
    return { ok: false, error: insertError.message }
  }

  revalidatePath('/home')
  return { ok: true }
}
