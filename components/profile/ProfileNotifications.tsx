'use client'

import { useEffect, useMemo, useState } from 'react'
import OneSignal from 'react-onesignal'

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

function readPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export function ProfileNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setPermission(readPermission())
  }, [])

  const hint = useMemo(() => {
    if (permission === 'unsupported') {
      return 'This browser does not support push notifications.'
    }
    if (permission === 'granted') {
      return 'Push notifications are enabled for this device.'
    }
    if (permission === 'denied') {
      return 'Notifications are blocked. Enable them in browser site settings.'
    }
    return 'Allow notifications to receive message, like, and comment alerts.'
  }, [permission])

  async function enableNotifications() {
    if (permission === 'unsupported' || pending) {
      return
    }

    setPending(true)
    setMessage(null)
    try {
      await OneSignal.Notifications.requestPermission()
      setPermission(readPermission())
      if (Notification.permission === 'granted') {
        setMessage('Notifications are now enabled.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not enable notifications.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="profile-notifications">
      <p className="profile-section-label">Notifications</p>
      <div className="profile-row">
        <div>
          <p className="profile-row-title">Web push notifications</p>
          <p className="profile-row-desc">{hint}</p>
        </div>
        <button
          type="button"
          className="profile-notification-btn"
          onClick={() => void enableNotifications()}
          disabled={pending || permission === 'unsupported' || permission === 'granted'}
        >
          {permission === 'granted'
            ? 'Enabled'
            : pending
              ? 'Enabling...'
              : 'Enable'}
        </button>
      </div>
      {message ? <p className="profile-hint">{message}</p> : null}
    </div>
  )
}
