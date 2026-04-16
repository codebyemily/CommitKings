export type SharedPostPayload = {
  postId: string
  authorUsername: string
  caption: string
  imageSrc: string
}

const SHARED_POST_PREFIX = '[shared_post]'

export function encodeSharedPostMessage(payload: SharedPostPayload): string {
  return `${SHARED_POST_PREFIX}${JSON.stringify(payload)}`
}

export function decodeSharedPostMessage(body: string): SharedPostPayload | null {
  if (!body.startsWith(SHARED_POST_PREFIX)) return null
  try {
    const parsed = JSON.parse(
      body.slice(SHARED_POST_PREFIX.length),
    ) as Partial<SharedPostPayload>
    if (
      typeof parsed.postId !== 'string' ||
      typeof parsed.authorUsername !== 'string' ||
      typeof parsed.caption !== 'string' ||
      typeof parsed.imageSrc !== 'string'
    ) {
      return null
    }
    return {
      postId: parsed.postId,
      authorUsername: parsed.authorUsername,
      caption: parsed.caption,
      imageSrc: parsed.imageSrc,
    }
  } catch {
    return null
  }
}

export function toConversationPreview(body: string | null): string | null {
  if (!body) return body
  return body.startsWith(SHARED_POST_PREFIX) ? 'Shared a post' : body
}
