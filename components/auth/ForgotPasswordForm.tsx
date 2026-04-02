'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
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
        />

        <button type="submit" className="auth-submit">
          Send Reset Link
        </button>
      </form>

      <div className="auth-divider" role="separator" />

      <Link className="auth-link auth-back-link" href="/login">
        Back to Login
      </Link>
    </>
  )
}
