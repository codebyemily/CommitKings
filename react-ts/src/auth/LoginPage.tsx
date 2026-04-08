import './auth.css'

type LoginPageProps = {
  onForgotPassword: () => void
  onSignUp: () => void
}

export function LoginPage({ onForgotPassword, onSignUp }: LoginPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Forum Neighborhood</h1>
        <p className="auth-subtitle">Sign in to continue</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="visually-hidden" htmlFor="login-identifier">
            Email or Username
          </label>
          <input
            id="login-identifier"
            className="auth-field"
            type="text"
            name="identifier"
            autoComplete="username"
            placeholder="Email or Username"
          />
          <label className="visually-hidden" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="auth-field"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
          />
          <button type="submit" className="auth-btn-primary">
            Log In
          </button>
        </form>

        <button
          type="button"
          className="auth-link auth-forgot"
          onClick={onForgotPassword}
        >
          Forgot Password?
        </button>

        <hr className="auth-divider" />

        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <button type="button" className="auth-link" onClick={onSignUp}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}
