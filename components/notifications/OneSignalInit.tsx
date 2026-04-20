'use client'

import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

export default function OneSignalInit() {
  useEffect(() => {
    const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? ''

    if (!oneSignalAppId || typeof window === 'undefined') {
      return
    }

    async function initOneSignal() {
      try {
        await OneSignal.init({
          appId: oneSignalAppId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
        })
      } catch (error) {
        console.error('OneSignal init failed', error)
      }
    }

    void initOneSignal()
  }, [])

  return null
}
