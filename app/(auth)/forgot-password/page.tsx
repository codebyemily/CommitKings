import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ForgotPasswordPage() {
  return (
    <main className="auth-card">
      <h1 className="auth-title">Reset Password</h1>
      <p className="auth-subtitle">
        Enter your email to receive a reset link
      </p>
      <ForgotPasswordForm />
    </main>
  )
}
