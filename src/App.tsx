import { type FormEvent, useState } from 'react'
import './App.css'

function App() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 className="login-title">Forum Neighborhood</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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

          <button type="submit" className="login-submit">
            Log In
          </button>
        </form>

        <a className="login-link forgot" href="#forgot-password">
          Forgot Password?
        </a>

        <div className="login-divider" role="separator" />

        <p className="login-footer">
          Don&apos;t have an account?{' '}
          <a className="login-link" href="#sign-up">
            Sign Up
          </a>
        </p>
      </div>
    </main>
  )
}

export default App
