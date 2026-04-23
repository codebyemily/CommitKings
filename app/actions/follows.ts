'use server'

import { createClient } from '@/lib/supabase/server'
import { isMissingFollowsTable } from '@/lib/posts/schema-fallback'
import { revalidatePath } from 'next/cache'

export type FollowActionResult =
  | { ok: true; following: boolean }
  | { ok: false; error: string }

function revalidateAfterFollowChange(usernameForPath: string) {
  const raw = usernameForPath.trim().replace(/^@+/, '')
  if (raw) {
    revalidatePath(`/u/${raw}`)
  }
  revalidatePath('/following')
  revalidatePath('/home')
  revalidatePath('/profile')
}

export async function toggleFollowAction(input: {
  followingId: string
  usernameForPath: string
}): Promise<FollowActionResult> {
  const target = input.followingId.trim()
  if (!target) {
    return { ok: false, error: 'Invalid user.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Sign in to follow people.' }
  }

  if (user.id === target) {
    return { ok: false, error: 'You cannot follow yourself.' }
  }

  const { data: existing, error: findErr } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', target)
    .maybeSingle()

  if (findErr) {
    if (isMissingFollowsTable(findErr.message)) {
      return {
        ok: false,
        error:
          'Follows are not set up on this project yet. Ask an admin to apply the latest Supabase migrations.',
      }
    }
    return { ok: false, error: findErr.message }
  }

  if (existing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', target)

    if (error) {
      if (isMissingFollowsTable(error.message)) {
        return {
          ok: false,
          error:
            'Follows are not set up on this project yet. Ask an admin to apply the latest Supabase migrations.',
        }
      }
      return { ok: false, error: error.message }
    }

    revalidateAfterFollowChange(input.usernameForPath)
    return { ok: true, following: false }
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: user.id,
    following_id: target,
  })

  if (error) {
    if (isMissingFollowsTable(error.message)) {
      return {
        ok: false,
        error:
          'Follows are not set up on this project yet. Ask an admin to apply the latest Supabase migrations.',
      }
    }
    return { ok: false, error: error.message }
  }

  revalidateAfterFollowChange(input.usernameForPath)
  return { ok: true, following: true }
}
