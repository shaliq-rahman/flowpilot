'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message) }
    else { router.push('/dashboard'); router.refresh() }
    setLoading(false)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm bg-white transition-all outline-none"
  const inputStyle = { border: '1px solid var(--pm-border)', color: 'var(--pm-text)' }

  function focus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--pm-accent)'
    e.target.style.boxShadow = '0 0 0 3px rgba(44,82,216,0.10)'
  }
  function blur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--pm-border)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div>
      <h1
        className="text-3xl mb-1.5"
        style={{ fontFamily: 'var(--font-sans)', color: 'var(--pm-text)', fontWeight: 400 }}
      >
        Welcome back
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--pm-text-3)' }}>
        Sign in to your workspace
      </p>

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--pm-text-3)' }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required placeholder="you@company.com"
            className={inputCls} style={inputStyle}
            onFocus={focus} onBlur={blur}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--pm-text-3)' }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required placeholder="••••••••"
            className={inputCls} style={inputStyle}
            onFocus={focus} onBlur={blur}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit" disabled={loading}
            className="fp-btn fp-btn-amber w-full py-3 text-sm"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--pm-text-3)' }}>
        No account?{' '}
        <Link href="/register" className="font-semibold transition-colors" style={{ color: 'var(--pm-accent-dark)' }}>
          Create one
        </Link>
      </p>
    </div>
  )
}
