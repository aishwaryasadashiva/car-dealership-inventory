import { useCallback, useEffect, useState } from 'react'
import * as api from '../api'
import type { User } from '../types'

const TOKEN_KEY = 'drivespace:token'

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * Holds the JWT and the signed-in user. The token lives in sessionStorage
 * (cleared when the tab closes) and the user - including the admin flag - is
 * always re-read from the server, never trusted from the browser.
 */
export function useSession() {
  const [token, setToken] = useState(readToken)
  const [user, setUser] = useState<User | null>(null)
  const [restoring, setRestoring] = useState(Boolean(readToken()))

  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    setToken('')
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token || user) return
    let cancelled = false
    api
      .fetchMe(token)
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && clear())
      .finally(() => !cancelled && setRestoring(false))
    return () => {
      cancelled = true
    }
  }, [token, user, clear])

  const signIn = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.login(email, password)
    const me = await api.fetchMe(access_token)
    try {
      sessionStorage.setItem(TOKEN_KEY, access_token)
    } catch {
      /* private mode: the session simply will not survive a refresh */
    }
    setToken(access_token)
    setUser(me)
  }, [])

  const signUp = useCallback(
    async (email: string, password: string) => {
      await api.register(email, password)
      await signIn(email, password)
    },
    [signIn],
  )

  return { token, user, restoring, signIn, signUp, signOut: clear }
}
