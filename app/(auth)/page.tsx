import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function HomePage() {
  return (
    <main className="auth-card">
      <h1 className="auth-title">Forum Neighborhood</h1>
      <p className="auth-subtitle">Sign in to continue</p>
      <LoginForm />
    </main>
  )
}
