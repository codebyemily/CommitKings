type SendOneSignalPushInput = {
  externalUserIds: string[]
  headings?: string
  contents: string
  url?: string
}

function getOneSignalConfig() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY
  if (!appId || !restApiKey) {
    return null
  }
  return { appId, restApiKey }
}

export async function sendOneSignalPushToExternalUsers(
  input: SendOneSignalPushInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getOneSignalConfig()
  if (!config) {
    return { ok: false, error: 'OneSignal is not configured.' }
  }

  const recipients = input.externalUserIds.map((id) => id.trim()).filter(Boolean)
  if (!recipients.length) {
    return { ok: false, error: 'No recipients provided.' }
  }

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.restApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: config.appId,
        include_aliases: {
          external_id: recipients,
        },
        target_channel: 'push',
        ...(input.headings?.trim()
          ? { headings: { en: input.headings.trim() } }
          : {}),
        contents: { en: input.contents.trim() },
        ...(input.url?.trim() ? { url: input.url.trim() } : {}),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return {
        ok: false,
        error: data?.errors?.join(', ') || data?.error || 'OneSignal request failed.',
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to reach OneSignal.',
    }
  }
}
