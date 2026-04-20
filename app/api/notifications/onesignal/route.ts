import { NextResponse } from 'next/server'

type SendNotificationBody = {
  contents: string
  headings?: string
  url?: string
  externalUserIds?: string[]
  includedSegments?: string[]
}

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
const restApiKey = process.env.ONESIGNAL_REST_API_KEY

export async function POST(request: Request) {
  if (!appId || !restApiKey) {
    return NextResponse.json(
      { error: 'OneSignal is not configured. Missing environment variables.' },
      { status: 500 },
    )
  }

  let body: SendNotificationBody

  try {
    body = (await request.json()) as SendNotificationBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const contents = body.contents?.trim()
  if (!contents) {
    return NextResponse.json(
      { error: '`contents` is required.' },
      { status: 400 },
    )
  }

  const includeAliases =
    body.externalUserIds && body.externalUserIds.length > 0
      ? {
          include_aliases: {
            external_id: body.externalUserIds,
          },
          target_channel: 'push',
        }
      : null

  const includeSegments =
    body.includedSegments && body.includedSegments.length > 0
      ? { included_segments: body.includedSegments }
      : null

  if (!includeAliases && !includeSegments) {
    return NextResponse.json(
      {
        error:
          'Targeting required. Provide `externalUserIds` or `includedSegments`.',
      },
      { status: 400 },
    )
  }

  const payload = {
    app_id: appId,
    ...(body.headings?.trim() ? { headings: { en: body.headings.trim() } } : {}),
    contents: { en: contents },
    ...(body.url?.trim() ? { url: body.url.trim() } : {}),
    ...(includeAliases ?? {}),
    ...(includeSegments ?? {}),
  }

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${restApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseData = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to send OneSignal notification.', details: responseData },
      { status: response.status },
    )
  }

  return NextResponse.json({ success: true, data: responseData })
}
