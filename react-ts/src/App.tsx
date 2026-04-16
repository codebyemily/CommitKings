import { useState } from 'react'
import { LoginPage } from './auth/LoginPage'
import { ResetPasswordPage } from './auth/ResetPasswordPage'
import { SignUpPage } from './auth/SignUpPage'

type AuthScreen = 'login' | 'reset' | 'signup'

function App() {
  const [screen, setScreen] = useState<AuthScreen>('login')

  if (screen === 'reset') {
    return <ResetPasswordPage onBackToLogin={() => setScreen('login')} />
  }

  if (screen === 'signup') {
    return <SignUpPage onLogIn={() => setScreen('login')} />
  }

  return (
    <LoginPage
      onForgotPassword={() => setScreen('reset')}
      onSignUp={() => setScreen('signup')}
    />
  )
}

export default App
