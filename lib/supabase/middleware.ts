import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

/** Routes that show login/signup; logged-in users are sent to /home */
const AUTH_SCREEN_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
])

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value)
  })
}

/** Refreshes the session, then enforces auth redirects for /home vs login routes. */
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (
    !user &&
    (pathname.startsWith('/home') ||
      pathname === '/profile' ||
      pathname === '/activity')
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  if (user && AUTH_SCREEN_ROUTES.has(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/home'
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  return supabaseResponse
}
