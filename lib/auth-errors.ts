/** Map Supabase Auth errors to short, user-facing messages. */
export function getAuthErrorMessage(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Incorrect email or password.'
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox.'
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (m.includes('password') && m.includes('least')) {
    return 'Password does not meet requirements. Use a stronger password.'
  }
  if (m.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (m.includes('signup is disabled')) {
    return 'New signups are disabled.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  return message
}
