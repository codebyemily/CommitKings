import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/auth/SignOutButton'

export const metadata: Metadata = {
  title: 'Home',
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main
      style={{
        minHeight: '100svh',
        padding: '2rem',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <SignOutButton />
      </div>
    </main>
  )
}
