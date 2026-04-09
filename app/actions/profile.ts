'use server'

import { createClient } from '@/lib/supabase/server'
import { isMissingAuthorAvatarPathColumn } from '@/lib/posts/schema-fallback'
import { revalidatePath } from 'next/cache'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateProfileAction(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const displayName = String(formData.get('display_name') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim().replace(/^@/, '')
  const bio = String(formData.get('bio') ?? '').trim()
  const removeAvatar = formData.get('remove_avatar') === '1'
  const avatarField = formData.get('avatar')

  if (!displayName || displayName.length > 80) {
    return { ok: false, error: 'Display name must be 1–80 characters.' }
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: 'Username must be 3–30 characters (letters, numbers, underscores).',
    }
  }
  if (bio.length > 280) {
    return { ok: false, error: 'Bio must be 280 characters or fewer.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, error: 'You must be signed in to update your profile.' }
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  let avatarPath =
    typeof meta.avatar_path === 'string' && meta.avatar_path.trim()
      ? meta.avatar_path.trim()
      : ''

  if (removeAvatar && avatarPath) {
    await supabase.storage.from('post-images').remove([avatarPath])
    avatarPath = ''
  }

  if (avatarField instanceof File && avatarField.size > 0) {
    if (avatarField.size > MAX_AVATAR_BYTES) {
      return { ok: false, error: 'Profile photo must be 2 MB or smaller.' }
    }
    if (!AVATAR_TYPES.has(avatarField.type)) {
      return {
        ok: false,
        error: 'Use a JPEG, PNG, WebP, or GIF for your profile photo.',
      }
    }
    const ext =
      avatarField.type === 'image/png'
        ? 'png'
        : avatarField.type === 'image/webp'
          ? 'webp'
          : avatarField.type === 'image/gif'
            ? 'gif'
            : 'jpg'
    const newPath = `${user.id}/avatar/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(newPath, avatarField, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      return { ok: false, error: uploadError.message }
    }

    if (avatarPath && avatarPath !== newPath) {
      await supabase.storage.from('post-images').remove([avatarPath])
    }
    avatarPath = newPath
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      full_name: displayName,
      display_name: displayName,
      username,
      bio,
      avatar_path: avatarPath || null,
    },
  })

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  const { error: postsError } = await supabase
    .from('posts')
    .update({ author_avatar_path: avatarPath || null })
    .eq('user_id', user.id)

  if (
    postsError &&
    !isMissingAuthorAvatarPathColumn(postsError.message)
  ) {
    return { ok: false, error: postsError.message }
  }

  revalidatePath('/profile')
  revalidatePath('/home')
  return { ok: true }
}
