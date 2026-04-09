import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'
import { SiteLogo } from '@/components/brand/SiteLogo'

export const metadata: Metadata = {
  title: 'Sign up',
}

export default function SignupPage() {
  return (
    <main className="auth-card">
      <h1 className="auth-logo-heading">
        <SiteLogo variant="auth" />
      </h1>
      <p className="auth-subtitle">
        Create an account to join the neighborhood.
      </p>
      <SignupForm />
    </main>
  )
}
