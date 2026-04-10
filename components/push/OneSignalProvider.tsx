'use client'

import { createClient } from '@/lib/supabase/client'
import {
  ensureOneSignalInitialized,
  getOneSignalAppId,
} from '@/lib/push/onesignal-init'
import OneSignal from 'react-onesignal'
import { useEffect } from 'react'

/**
 * Loads OneSignal (web push) and maps the Supabase user to OneSignal via
 * `OneSignal.login(user.id)` so you can target users with External User Id from the REST API.
 *
 * Set `NEXT_PUBLIC_ONESIGNAL_APP_ID` in `.env.local`. Without it, this component is a no-op.
 */
export function OneSignalProvider() {
  useEffect(() => {
    const appId = getOneSignalAppId()
    if (!appId) return

    let cancelled = false
    let offAuth: (() => void) | undefined
    const supabase = createClient()

    const syncUser = async (userId: string | undefined) => {
      if (userId) {
        await OneSignal.login(userId)
      } else {
        await OneSignal.logout()
      }
    }

    void (async () => {
      try {
        await ensureOneSignalInitialized(appId)
        if (cancelled) return

        const {
          data: { session },
        } = await supabase.auth.getSession()
        await syncUser(session?.user?.id)

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          await syncUser(nextSession?.user?.id)
        })

        offAuth = () => subscription.unsubscribe()
      } catch (err) {
        console.error('OneSignal:', err)
      }
    })()

    return () => {
      cancelled = true
      offAuth?.()
    }
  }, [])

  return null
}
