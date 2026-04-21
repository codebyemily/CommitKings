'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthorIdentityFromProfile } from '@/lib/data/profile-identity'
import { engagementSchemaErrorMessage } from '@/lib/posts/schema-fallback'
import { sendOneSignalPushToExternalUsers } from '@/lib/notifications/onesignal'
import { revalidatePath } from 'next/cache'

export type ToggleLikeResult =
  | { ok: true; liked: boolean; likesCount: number }
  | { ok: false; error: string }

export type AddCommentResult =
  | {
      ok: true
      comment: {
        id: string
        body: string
        created_at: string
        author_username: string
        author_display_name: string
      }
    }
  | { ok: false; error: string }

export type ToggleSaveResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string }

export async function togglePostLikeAction(postId: string): Promise<ToggleLikeResult> {
  const trimmed = postId.trim()
  if (!trimmed) {
    return { ok: false, error: 'Invalid post.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', trimmed)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return {
      ok: false,
      error: engagementSchemaErrorMessage(existingError.message),
    }
  }

  if (existing) {
    const { error: delError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', trimmed)
      .eq('user_id', user.id)

    if (delError) {
      return { ok: false, error: engagementSchemaErrorMessage(delError.message) }
    }
  } else {
    const { error: insError } = await supabase.from('post_likes').insert({
      post_id: trimmed,
      user_id: user.id,
    })

    if (insError) {
      return { ok: false, error: engagementSchemaErrorMessage(insError.message) }
    }
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('likes_count, user_id, author_username')
    .eq('id', trimmed)
    .maybeSingle()

  if (postError || !post) {
    return {
      ok: false,
      error: engagementSchemaErrorMessage(postError?.message ?? 'Post not found.'),
    }
  }

  if (!existing && post.user_id !== user.id) {
    const { username } = await getAuthorIdentityFromProfile(supabase, user)
    const pushResult = await sendOneSignalPushToExternalUsers({
      externalUserIds: [post.user_id],
      headings: 'New like',
      contents: `@${username} liked your post.`,
      url: `/home?post=${trimmed}`,
    })
    if (!pushResult.ok) {
      console.error('OneSignal like notification failed:', pushResult.error)
    }
  }

  revalidatePath('/home')
  return {
    ok: true,
    liked: !existing,
    likesCount: post.likes_count ?? 0,
  }
}

export async function addPostCommentAction(
  postId: string,
  body: string,
): Promise<AddCommentResult> {
  const trimmedId = postId.trim()
  const text = body.trim()
  if (!trimmedId) {
    return { ok: false, error: 'Invalid post.' }
  }
  if (!text || text.length > 2000) {
    return { ok: false, error: 'Comment must be 1–2000 characters.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const { username, displayName } = await getAuthorIdentityFromProfile(
    supabase,
    user,
  )

  const { data: row, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: trimmedId,
      user_id: user.id,
      author_username: username,
      author_display_name: displayName,
      body: text,
    })
    .select('id, body, created_at, author_username, author_display_name')
    .single()

  if (error || !row) {
    return {
      ok: false,
      error: engagementSchemaErrorMessage(
        error?.message ?? 'Could not add comment.',
      ),
    }
  }

  const { data: postOwner } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', trimmedId)
    .maybeSingle()

  if (postOwner?.user_id && postOwner.user_id !== user.id) {
    const preview = text.length > 90 ? `${text.slice(0, 90)}...` : text
    const pushResult = await sendOneSignalPushToExternalUsers({
      externalUserIds: [postOwner.user_id],
      headings: 'New comment',
      contents: `@${username} commented on your post: "${preview}"`,
      url: `/home?post=${trimmedId}`,
    })
    if (!pushResult.ok) {
      console.error('OneSignal comment notification failed:', pushResult.error)
    }
  }

  revalidatePath('/home')
  return {
    ok: true,
    comment: {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      author_username: row.author_username,
      author_display_name: row.author_display_name,
    },
  }
}

export async function togglePostSaveAction(postId: string): Promise<ToggleSaveResult> {
  const trimmed = postId.trim()
  if (!trimmed) {
    return { ok: false, error: 'Invalid post.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('post_saves')
    .select('post_id')
    .eq('post_id', trimmed)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return {
      ok: false,
      error: engagementSchemaErrorMessage(existingError.message),
    }
  }

  if (existing) {
    const { error: delError } = await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', trimmed)
      .eq('user_id', user.id)

    if (delError) {
      return { ok: false, error: engagementSchemaErrorMessage(delError.message) }
    }
  } else {
    const { error: insError } = await supabase.from('post_saves').insert({
      post_id: trimmed,
      user_id: user.id,
    })

    if (insError) {
      return { ok: false, error: engagementSchemaErrorMessage(insError.message) }
    }
  }

  revalidatePath('/home')
  revalidatePath('/activity?tab=saved')
  return { ok: true, saved: !existing }
}
