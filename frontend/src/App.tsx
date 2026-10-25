import { useCallback, useState } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { useSession } from './hooks/useSession'

function App() {
  const { token, user, restoring, signIn, signUp, signOut } = useSession()
  const [notice, setNotice] = useState('')

  const expire = useCallback(() => {
    setNotice('Your session expired. Please sign in again.')
    signOut()
  }, [signOut])

  const logout = useCallback(() => {
    setNotice('')
    signOut()
  }, [signOut])

  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink" role="status" aria-label="Loading">
        <div className="shimmer h-2 w-40 rounded-full" />
      </div>
    )
  }

  if (!token || !user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} notice={notice} />
  }

  return <Dashboard token={token} user={user} onLogout={logout} onSessionExpired={expire} />
}

export default App
