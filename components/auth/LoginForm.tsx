'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(getAuthErrorMessage(signInError.message))
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="sr-only" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Log In'}
        </button>
      </form>

      <Link className="auth-link forgot" href="/forgot-password">
        Forgot Password?
      </Link>

      <div className="auth-divider" role="separator" />

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link className="auth-link auth-link-inline" href="/signup">
          Sign Up
        </Link>
      </p>
    </>
  )
}
