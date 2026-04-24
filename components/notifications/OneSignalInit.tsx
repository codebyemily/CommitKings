'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ensureOneSignalReady } from '@/lib/notifications/onesignal-client'

function shouldInitOneSignal(pathname: string | null): boolean {
  if (!pathname) return false
  return (
    pathname.startsWith('/home') ||
    pathname === '/search' ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/u/') ||
    pathname === '/follow-requests' ||
    pathname === '/profile' ||
    pathname === '/activity' ||
    pathname === '/following' ||
    pathname === '/create'
  )
}

export default function OneSignalInit() {
  const pathname = usePathname()

  useEffect(() => {
    if (!shouldInitOneSignal(pathname)) return
    void ensureOneSignalReady()
  }, [pathname])

  return null
}
