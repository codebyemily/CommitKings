'use client'

import OneSignal from 'react-onesignal'
import { createClient } from '@/lib/supabase/client'

let initPromise: Promise<void> | null = null
let authListenerBound = false

const ONESIGNAL_SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function toPromise<T>(value: Promise<T> | T): Promise<T> {
  return Promise.resolve(value)
}

function friendlyErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Unknown error'
  const lower = raw.toLowerCase()

  if (lower.includes('script failed to load')) {
    return 'OneSignal script failed to load. Disable ad blockers/privacy extensions for this site, then refresh and try again.'
  }

  return raw
}

export type OneSignalDiagnostics = {
  origin: string
  isSecureContext: boolean
  notificationsSupported: boolean
  serviceWorkerSupported: boolean
  sdkReachable: boolean
  sdkReachableError: string | null
}

export async function getOneSignalDiagnostics(): Promise<OneSignalDiagnostics> {
  const diagnostics: OneSignalDiagnostics = {
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
    notificationsSupported:
      typeof window !== 'undefined' && typeof window.Notification !== 'undefined',
    serviceWorkerSupported:
      typeof window !== 'undefined' && 'serviceWorker' in navigator,
    sdkReachable: false,
    sdkReachableError: null,
  }

  if (typeof window === 'undefined') {
    diagnostics.sdkReachableError = 'Not running in browser context.'
    return diagnostics
  }

  try {
    await withTimeout(
      fetch(ONESIGNAL_SDK_URL, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      }),
      7000,
      'Timed out reaching OneSignal CDN.',
    )
    diagnostics.sdkReachable = true
  } catch (error) {
    diagnostics.sdkReachable = false
    diagnostics.sdkReachableError =
      error instanceof Error ? error.message : 'Unknown network error.'
  }

  return diagnostics
}

async function applyOneSignalIdentity(userId: string | null): Promise<void> {
  const oneSignalAny = OneSignal as unknown as {
    login?: (id: string) => Promise<void> | void
    logout?: () => Promise<void> | void
    User?: {
      addTag?: (key: string, value: string) => Promise<void>
      addTags?: (tags: Record<string, string>) => Promise<void>
      removeTag?: (key: string) => Promise<void>
    }
  }

  if (userId) {
    const loginResult = oneSignalAny.login
      ? oneSignalAny.login(userId)
      : OneSignal.login(userId)
    await withTimeout(
      toPromise(loginResult),
      6000,
      'OneSignal user login timed out.',
    )
    const addTag = oneSignalAny.User?.addTag
    const addTags = oneSignalAny.User?.addTags
    if (addTag) {
      await withTimeout(
        toPromise(addTag('supabase_user_id', userId)),
        6000,
        'OneSignal user tag sync timed out.',
      )
    } else if (addTags) {
      await withTimeout(
        toPromise(addTags({ supabase_user_id: userId })),
        6000,
        'OneSignal user tags sync timed out.',
      )
    }

    return
  }
  const removeTag = oneSignalAny.User?.removeTag
  if (removeTag) {
    await withTimeout(
      toPromise(removeTag('supabase_user_id')),
      6000,
      'OneSignal user tag cleanup timed out.',
    )
  }
  const logoutResult = oneSignalAny.logout ? oneSignalAny.logout() : OneSignal.logout()
  await withTimeout(
    toPromise(logoutResult),
    6000,
    'OneSignal user logout timed out.',
  )
}

async function syncOneSignalExternalUserId() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const targetUserId = user?.id ?? null
  let lastError: unknown = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await applyOneSignalIdentity(targetUserId)
      lastError = null
      break
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await delay(500 * attempt)
      }
    }
  }
  if (lastError) {
    throw lastError
  }

  if (!authListenerBound) {
    authListenerBound = true
    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      void applyOneSignalIdentity(nextUserId).catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        console.error('OneSignal auth sync failed:', message)
      })
    })
  }
}

export async function syncOneSignalUserAlias(): Promise<void> {
  await syncOneSignalExternalUserId()
}

export async function ensureOneSignalReady(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? ''
  if (!oneSignalAppId || typeof window === 'undefined') {
    return { ok: false, error: 'OneSignal is not configured in this environment.' }
  }

  if (!initPromise) {
    initPromise = (async () => {
      await withTimeout(
        OneSignal.init({
          appId: oneSignalAppId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/OneSignalSDKWorker.v2.js',
          serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.v2.js',
        }),
        10000,
        'OneSignal initialization timed out.',
      )

      void syncOneSignalExternalUserId().catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        console.error('OneSignal initial user sync failed:', message)
      })
    })()
  }

  try {
    await initPromise
    return { ok: true }
  } catch (error) {
    const message = friendlyErrorMessage(error)
    if (message.toLowerCase().includes('already initialized')) {
      // The SDK is ready; this can happen if init is called more than once.
      initPromise = Promise.resolve()
      return { ok: true }
    }
    initPromise = null
    return { ok: false, error: message }
  }
}
