import OneSignal from 'react-onesignal'

let initPromise: Promise<void> | null = null

export function getOneSignalAppId(): string | undefined {
  return process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() || undefined
}

/** Single init for the whole app (safe across React StrictMode remounts). */
export function ensureOneSignalInitialized(appId: string): Promise<void> {
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
      serviceWorkerPath: '/OneSignalSDKWorker.js',
    })
  }
  return initPromise
}
