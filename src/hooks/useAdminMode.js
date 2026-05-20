import { useState, useEffect } from 'react'
import { ADMIN_PIN } from '../lib/constants'

const STORAGE_KEY = 'the-felt-admin'
const EVENT = 'adminModeChange'

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'true')

  useEffect(() => {
    const handler = () => setIsAdmin(sessionStorage.getItem(STORAGE_KEY) === 'true')
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  function unlock(pin) {
    if (!ADMIN_PIN || pin !== ADMIN_PIN) return false
    sessionStorage.setItem(STORAGE_KEY, 'true')
    window.dispatchEvent(new Event(EVENT))
    return true
  }

  function lock() {
    sessionStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(EVENT))
  }

  return { isAdmin, unlock, lock }
}
