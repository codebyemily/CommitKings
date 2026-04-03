import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Choose a new password',
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-card">
      <h1 className="auth-title">New password</h1>
      <p className="auth-subtitle">
        Enter your new password below to finish signing in.
      </p>
      <ResetPasswordForm />
    </main>
  )
}
