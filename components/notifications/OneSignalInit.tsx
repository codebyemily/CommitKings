'use client'

import { useEffect } from 'react'
import OneSignal from 'react-onesignal'
import { createClient } from '@/lib/supabase/client'

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

        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.id) {
          await OneSignal.login(user.id)
        } else {
          await OneSignal.logout()
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          const nextUserId = session?.user?.id
          if (nextUserId) {
            void OneSignal.login(nextUserId)
          } else {
            void OneSignal.logout()
          }
        })
      } catch (error) {
        console.error('OneSignal init failed', error)
      }
    }

    void initOneSignal()
  }, [])

  return null
}
