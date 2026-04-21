'use client'

import { useEffect } from 'react'
import { ensureOneSignalReady } from '@/lib/notifications/onesignal-client'

export default function OneSignalInit() {
  useEffect(() => {
    void ensureOneSignalReady()
  }, [])

  return null
}
