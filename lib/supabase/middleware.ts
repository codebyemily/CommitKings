import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

/** Refreshes the user session and syncs auth cookies (run from root middleware). */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getAnonKey()
  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  await supabase.auth.getUser()

  return supabaseResponse
}
