'use client'

import { useEffect, useMemo, useState } from 'react'
import OneSignal from 'react-onesignal'
import {
  ensureOneSignalReady,
  syncOneSignalUserAlias,
} from '@/lib/notifications/onesignal-client'

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

function readPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
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

function toPromise<T>(value: Promise<T> | T): Promise<T> {
  return Promise.resolve(value)
}

function readOneSignalOptedIn(): boolean | null {
  const oneSignalAny = OneSignal as unknown as {
    User?: { PushSubscription?: { optedIn?: boolean } }
  }
  const value = oneSignalAny.User?.PushSubscription?.optedIn
  return typeof value === 'boolean' ? value : null
}

async function waitForOptInState(
  desired: boolean,
  timeoutMs = 10000,
  pollMs = 250,
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (readOneSignalOptedIn() === desired) {
      return true
    }
    await new Promise<void>((resolve) => window.setTimeout(resolve, pollMs))
  }
  return false
}

export function ProfileNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setPermission(readPermission())
  }, [])

  async function refreshSubscriptionState() {
    if (typeof window === 'undefined') {
      setSubscribed(null)
      return
    }
    try {
      const sdkOptedIn = readOneSignalOptedIn()
      if (typeof sdkOptedIn === 'boolean') {
        setSubscribed(sdkOptedIn)
        return
      }
      // Avoid false positives from non-OneSignal subscriptions when SDK is unavailable.
      setSubscribed(null)
    } catch {
      setSubscribed(null)
    }
  }

  useEffect(() => {
    void refreshSubscriptionState()
  }, [permission])

  const hint = useMemo(() => {
    if (permission === 'unsupported') {
      return 'This browser does not support push notifications.'
    }
    if (permission === 'granted' && subscribed === false) {
      return 'Browser permission is allowed, but push is disabled for this browser.'
    }
    if (permission === 'granted') {
      return 'Push notifications are enabled for this device.'
    }
    if (permission === 'denied') {
      return 'Notifications are blocked. Enable them in browser site settings.'
    }
    return 'Allow notifications to receive message, like, and comment alerts.'
  }, [permission, subscribed])

  async function enableNotifications() {
    if (permission === 'unsupported' || pending) {
      return
    }

    setPending(true)
    setMessage(null)
    try {
      const initTimeoutMs = 12000
      const initTimeout = new Promise<{ ok: false; error: string }>((resolve) => {
        window.setTimeout(
          () =>
            resolve({
              ok: false,
              error:
                'OneSignal initialization timed out. Check ad blockers/privacy shields, then refresh and try again.',
            }),
          initTimeoutMs,
        )
      })
      const ready = await Promise.race([ensureOneSignalReady(), initTimeout])
      if (!ready.ok) {
        setMessage(ready.error)
        if (ready.error.toLowerCase().includes('timed out')) {
          const d = await getOneSignalDiagnostics()
          setDiag(d)
        }
        return
      }

      const currentPermission = readPermission()
      if (currentPermission !== 'granted') {
        const timeoutMs = 12000
        const request = OneSignal.Notifications.requestPermission().catch((error) => {
          if (
            error instanceof Error &&
            error.message.toLowerCase().includes('already initialized')
          ) {
            return Notification.permission
          }
          return Notification.requestPermission()
        })
        const timeout = new Promise<'timeout'>((resolve) => {
          window.setTimeout(() => resolve('timeout'), timeoutMs)
        })

        const result = await Promise.race([request, timeout])
        if (result === 'timeout') {
          setMessage(
            'Permission request timed out. Check if the browser blocked the prompt, then try again.',
          )
          return
        }
      }

      const current = readPermission()
      setPermission(current)

      if (current === 'granted') {
        const oneSignalAny = OneSignal as unknown as {
          User?: { PushSubscription?: { optIn?: () => Promise<void> | void } }
          Notifications?: { setSubscription?: (enabled: boolean) => Promise<void> | void }
        }
        const optIn = oneSignalAny.User?.PushSubscription?.optIn
        if (optIn) {
          await withTimeout(
            toPromise(optIn()),
            6000,
            'Enabling push subscription timed out. Please try again.',
          )
        } else if (oneSignalAny.Notifications?.setSubscription) {
          await withTimeout(
            toPromise(oneSignalAny.Notifications.setSubscription(true)),
            6000,
            'Enabling push subscription timed out. Please try again.',
          )
        }
        await withTimeout(
          syncOneSignalUserAlias(),
          5000,
          'OneSignal user sync timed out. Please refresh and try again.',
        )
        const confirmedOptIn = await waitForOptInState(true)
        await refreshSubscriptionState()
        if (!confirmedOptIn) {
          setSubscribed(false)
          setMessage(
            'Browser permission is granted, but OneSignal still reports this device as unsubscribed. Please Disable then Enable again.',
          )
          return
        }
        setSubscribed(true)
        setMessage('Notifications are now enabled.')
      } else if (current === 'denied') {
        setMessage('Notifications were blocked. Enable them in browser site settings.')
      } else {
        setMessage('Notification permission was dismissed. You can try again.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not enable notifications.')
    } finally {
      setPending(false)
    }
  }

  async function disableNotifications() {
    if (pending) return
    setPending(true)
    setMessage(null)
    try {
      const initTimeout = new Promise<{ ok: false; error: string }>((resolve) => {
        window.setTimeout(
          () =>
            resolve({
              ok: false,
              error:
                'OneSignal initialization timed out while disabling. Local browser subscription cleanup will continue.',
            }),
          8000,
        )
      })
      const ready = await Promise.race([ensureOneSignalReady(), initTimeout])

      const oneSignalAny = OneSignal as unknown as {
        User?: { PushSubscription?: { optOut?: () => Promise<void> } }
        Notifications?: { setSubscription?: (enabled: boolean) => Promise<void> }
      }
      if (ready.ok) {
        const optOut = oneSignalAny.User?.PushSubscription?.optOut
        if (optOut) {
          void optOut()
        } else if (oneSignalAny.Notifications?.setSubscription) {
          void oneSignalAny.Notifications.setSubscription(false)
        }
      }

      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) {
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            await sub.unsubscribe()
          }
        }
      }

      await refreshSubscriptionState()
      setSubscribed(false)
      setMessage(
        ready.ok
          ? 'Push notifications were disabled for this browser. Browser permission may still show as allowed.'
          : `${ready.error} Push notifications were still disabled locally for this browser.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not disable notifications.')
    } finally {
      setPending(false)
    }
  }

  async function toggleNotifications() {
    if (pending || permission === 'unsupported') return
    if (permission === 'granted' && subscribed !== true) {
      await enableNotifications()
      return
    }
    if (permission === 'granted' && subscribed === true) {
      await disableNotifications()
      return
    }
    await enableNotifications()
  }

  const actionLabel = pending
    ? permission === 'granted' && subscribed === true
      ? 'Disabling...'
      : 'Enabling...'
    : permission === 'granted' && subscribed === true
      ? 'Disable'
      : 'Enable'

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
          onClick={() => void toggleNotifications()}
          disabled={pending || permission === 'unsupported'}
        >
          {actionLabel}
        </button>
      </div>
      <p className="profile-row-desc">
        Current status: {subscribed === null ? 'Unknown' : subscribed ? 'Subscribed' : 'Disabled'}
      </p>
      {message ? <p className="profile-hint">{message}</p> : null}
    </div>
  )
}
