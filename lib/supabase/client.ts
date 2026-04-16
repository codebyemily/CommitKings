import { createBrowserClient } from '@supabase/ssr'

function getAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

/** Supabase client for Client Components and browser-only code. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getAnonKey()
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local',
    )
  }
  return createBrowserClient(url, key)
}
