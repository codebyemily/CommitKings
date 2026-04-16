import './auth.css'

type SignUpPageProps = {
  onLogIn: () => void
}

export function SignUpPage({ onLogIn }: SignUpPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Forum Neighborhood</h1>
        <p className="auth-subtitle">Create your account</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="visually-hidden" htmlFor="signup-username">
            Username
          </label>
          <input
            id="signup-username"
            className="auth-field"
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Username"
          />
          <label className="visually-hidden" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            className="auth-field"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
          />
          <label className="visually-hidden" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            className="auth-field"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password"
          />
          <label className="visually-hidden" htmlFor="signup-confirm">
            Confirm Password
          </label>
          <input
            id="signup-confirm"
            className="auth-field"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm Password"
          />
          <button type="submit" className="auth-btn-primary">
            Create Account
          </button>
        </form>

        <hr className="auth-divider" />

        <p className="auth-footer-text">
          Already have an account?{' '}
          <button type="button" className="auth-link" onClick={onLogIn}>
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}
