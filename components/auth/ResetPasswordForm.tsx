'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [canReset, setCanReset] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCheckingSession(false)
        setCanReset(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCheckingSession(false)
        setCanReset(true)
      }
    })

    const t = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setCheckingSession(false)
          setCanReset(false)
        }
      })
    }, 3000)

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(t)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (updateError) {
      setError(getAuthErrorMessage(updateError.message))
      return
    }

    router.push('/home')
    router.refresh()
  }

  if (checkingSession) {
    return (
      <p className="auth-footer" style={{ textAlign: 'center' }}>
        Checking your session…
      </p>
    )
  }

  if (!canReset) {
    return (
      <>
        <p className="auth-error" style={{ marginBottom: 16 }}>
          This reset link is invalid or has expired. Request a new one from the
          forgot password page.
        </p>
        <Link className="auth-link" href="/forgot-password">
          Request a new link
        </Link>
        <div className="auth-divider" role="separator" />
        <Link className="auth-link" href="/login">
          Back to Login
        </Link>
      </>
    )
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="new-password">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <label className="sr-only" htmlFor="confirm-new-password">
          Confirm new password
        </label>
        <input
          id="confirm-new-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Updating…' : 'Set new password'}
        </button>
      </form>

      <div className="auth-divider" role="separator" />

      <Link className="auth-link" href="/login">
        Back to Login
      </Link>
    </>
  )
}
