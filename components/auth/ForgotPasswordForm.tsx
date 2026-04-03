'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    )

    setLoading(false)

    if (resetError) {
      setError(getAuthErrorMessage(resetError.message))
      return
    }

    setSuccess(true)
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="reset-email">
          Email
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error ? <p className="auth-error">{error}</p> : null}
        {success ? (
          <p className="auth-footer" style={{ textAlign: 'left' }}>
            If an account exists for that email, you will receive a reset link
            shortly.
          </p>
        ) : null}

        <button type="submit" className="auth-submit" disabled={loading || success}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <div className="auth-divider" role="separator" />

      <Link className="auth-link" href="/login">
        Back to Login
      </Link>
    </>
  )
}
