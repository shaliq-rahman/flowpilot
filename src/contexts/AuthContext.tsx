'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthContextValue {
  isAdmin: boolean
  email: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ isAdmin: false, email: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin: email === 'admin@flowpilot.com', email, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
