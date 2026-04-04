'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
      style={
        className
          ? undefined
          : {
              padding: '8px 16px',
              fontSize: '0.9375rem',
              color: '#3b82f6',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: loading ? 'wait' : 'pointer',
            }
      }
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
