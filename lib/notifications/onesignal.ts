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

  const headings = input.headings?.trim()
  const contents = input.contents.trim()
  const url = input.url?.trim()

  if (!contents) {
    return { ok: false, error: 'Notification content is required.' }
  }

  async function sendWithBody(body: Record<string, unknown>) {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.restApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = null
    }
    return { response, data }
  }

  function parseRecipientsCount(data: any): number | null {
    if (!data || typeof data !== 'object' || !('recipients' in data)) {
      return null
    }
    const raw = (data as { recipients?: unknown }).recipients
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
  }

  function buildUserTagFilters(ids: string[]) {
    const filters: Array<Record<string, string>> = []
    ids.forEach((id, index) => {
      if (index > 0) {
        filters.push({ operator: 'OR' })
      }
      filters.push({
        field: 'tag',
        key: 'supabase_user_id',
        relation: '=',
        value: id,
      })
    })
    return filters
  }

  try {
    // New User Model payload (aliases + target_channel).
    const primary = await sendWithBody({
      app_id: config.appId,
      include_aliases: {
        external_id: recipients,
      },
      target_channel: 'push',
      ...(headings ? { headings: { en: headings } } : {}),
      contents: { en: contents },
      ...(url ? { url } : {}),
    })
    if (primary.response.ok) {
      const delivered = parseRecipientsCount(primary.data)
      if (delivered === null || delivered > 0) {
        return { ok: true }
      }
    }

    // Legacy fallback payload for older OneSignal app setups.
    const fallback = await sendWithBody({
      app_id: config.appId,
      include_external_user_ids: recipients,
      channel_for_external_user_ids: 'push',
      ...(headings ? { headings: { en: headings } } : {}),
      contents: { en: contents },
      ...(url ? { url } : {}),
    })
    if (fallback.response.ok) {
      const delivered = parseRecipientsCount(fallback.data)
      if (delivered === null || delivered > 0) {
        return { ok: true }
      }
    }

    // Tag-based fallback for users whose alias mapping is missing.
    const tagged = await sendWithBody({
      app_id: config.appId,
      filters: buildUserTagFilters(recipients),
      target_channel: 'push',
      ...(headings ? { headings: { en: headings } } : {}),
      contents: { en: contents },
      ...(url ? { url } : {}),
    })
    if (tagged.response.ok) {
      const delivered = parseRecipientsCount(tagged.data)
      if (delivered === null || delivered > 0) {
        return { ok: true }
      }
      return { ok: false, error: 'OneSignal targeted 0 recipients.' }
    }

    return {
      ok: false,
      error:
        primary.data?.errors?.join(', ') ||
        primary.data?.error ||
        fallback.data?.errors?.join(', ') ||
        fallback.data?.error ||
        tagged.data?.errors?.join(', ') ||
        tagged.data?.error ||
        'OneSignal request failed.',
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to reach OneSignal.',
    }
  }
}
