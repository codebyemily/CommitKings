'use server'

import { createClient } from '@/lib/supabase/server'
import { engagementSchemaErrorMessage } from '@/lib/posts/schema-fallback'
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
    .select('likes_count')
    .eq('id', trimmed)
    .maybeSingle()

  if (postError || !post) {
    return {
      ok: false,
      error: engagementSchemaErrorMessage(postError?.message ?? 'Post not found.'),
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata as Record<string, unknown>
  const username =
    profile?.username?.trim() ||
    (typeof meta?.username === 'string' && meta.username.trim()) ||
    user.email?.split('@')[0] ||
    'user'
  const displayName =
    profile?.display_name?.trim() ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    username

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
