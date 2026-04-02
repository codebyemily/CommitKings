'use client'

import { type FormEvent, useState } from 'react'

export function LoginForm() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="email-or-username">
          Email or Username
        </label>
        <input
          id="email-or-username"
          name="emailOrUsername"
          type="text"
          autoComplete="username"
          placeholder="Email or Username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
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
        />

        <button type="submit" className="auth-submit">
          Log In
        </button>
      </form>

      <button type="button" className="auth-link forgot">
        Forgot Password?
      </button>

      <div className="auth-divider" role="separator" />

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <button type="button" className="auth-link auth-link-inline">
          Sign Up
        </button>
      </p>
    </>
  )
}
