function appOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (explicit) return explicit
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`
  return 'http://localhost:3000'
}

export type SendMessagePushResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Targets the recipient by External ID (same string passed to OneSignal.login in the browser).
 * @see https://documentation.onesignal.com/reference/create-notification
 */
export async function sendNewDirectMessagePush(params: {
  recipientUserId: string
  title: string
  body: string
  conversationId: string
}): Promise<SendMessagePushResult> {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY?.trim()
  const appId =
    process.env.ONESIGNAL_APP_ID?.trim() ||
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim()

  if (!apiKey || !appId) {
    return {
      ok: false,
      error:
        'Missing ONESIGNAL_REST_API_KEY or app id (ONESIGNAL_APP_ID or NEXT_PUBLIC_ONESIGNAL_APP_ID).',
    }
  }

  const openUrl = `${appOrigin()}/messages/${params.conversationId}`

  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      include_aliases: {
        external_id: [params.recipientUserId],
      },
      headings: { en: params.title },
      contents: { en: params.body },
      url: openUrl,
    }),
  })

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    return {
      ok: false,
      error:
        typeof data === 'object' && data !== null && 'errors' in data
          ? JSON.stringify((data as { errors: unknown }).errors)
          : res.statusText,
    }
  }

  return { ok: true }
}
