import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Sign up',
}

export default function SignupPage() {
  return (
    <main className="auth-card">
      <h1 className="auth-title">Forum Neighborhood</h1>
      <p className="auth-subtitle">
        Create an account to join the neighborhood.
      </p>
      <SignupForm />
    </main>
  )
}
