import { NextResponse } from 'next/server'
import { sendOneSignalPushToExternalUsers } from '@/lib/notifications/onesignal'

type SendNotificationBody = {
  contents: string
  headings?: string
  url?: string
  externalUserIds?: string[]
  includedSegments?: string[]
}

export async function POST(request: Request) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY
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

  const hasExternalUsers = Boolean(body.externalUserIds?.length)
  const hasSegments = Boolean(body.includedSegments?.length)

  if (!hasExternalUsers && !hasSegments) {
    return NextResponse.json(
      {
        error:
          'Targeting required. Provide `externalUserIds` or `includedSegments`.',
      },
      { status: 400 },
    )
  }

  if (hasExternalUsers) {
    const sent = await sendOneSignalPushToExternalUsers({
      externalUserIds: body.externalUserIds ?? [],
      headings: body.headings,
      contents,
      url: body.url,
    })

    if (!sent.ok) {
      return NextResponse.json(
        { error: 'Failed to send OneSignal notification.', details: sent.error },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  }

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${restApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: body.includedSegments,
      ...(body.headings?.trim() ? { headings: { en: body.headings.trim() } } : {}),
      contents: { en: contents },
      ...(body.url?.trim() ? { url: body.url.trim() } : {}),
    }),
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
