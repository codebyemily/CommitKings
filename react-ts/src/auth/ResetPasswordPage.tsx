import './auth.css'

type ResetPasswordPageProps = {
  onBackToLogin: () => void
}

export function ResetPasswordPage({ onBackToLogin }: ResetPasswordPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-page-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your email to receive a reset link</p>

        <form
          className="auth-form auth-form--compact"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="visually-hidden" htmlFor="reset-email">
            Email
          </label>
          <input
            id="reset-email"
            className="auth-field"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
          />
          <button type="submit" className="auth-btn-primary">
            Send Reset Link
          </button>
        </form>

        <hr className="auth-divider" />

        <button
          type="button"
          className="auth-link auth-after-divider"
          onClick={onBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}
