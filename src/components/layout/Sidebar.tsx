'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
]

interface SidebarProps {
  userEmail?: string
  userName?: string
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#2C52D8" />
      <path d="M14 5L17 13H14H11L14 5Z" fill="#fff" />
      <path d="M14 23L11 15H14H17L14 23Z" fill="#fff" opacity="0.35" />
      <circle cx="14" cy="14" r="2" fill="#fff" />
    </svg>
  )
}

export default function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? 'U'

  const displayName = userName || userEmail?.split('@')[0] || 'User'

  return (
    <aside
      className="flex h-full w-56 flex-col flex-shrink-0"
      style={{
        background: 'var(--pm-sidebar)',
        borderRight: '1px solid var(--pm-sidebar-border)',
        boxShadow: '1px 0 0 var(--pm-sidebar-border)',
      }}
    >
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo />
        <span
          className="text-[15px] font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--pm-text)' }}
        >
          FlowPilot
        </span>
      </div>

      {/* Section label */}
      <p className="px-5 mb-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--pm-text-3)' }}>
        Menu
      </p>

      {/* Nav */}
      <nav className="px-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
              style={{
                background: active ? 'var(--pm-sidebar-active)' : 'transparent',
                color: active ? 'var(--pm-accent)' : 'var(--pm-text-2)',
                fontWeight: active ? 600 : 500,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'var(--pm-sidebar-hover)'
                  el.style.color = 'var(--pm-text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = 'var(--pm-text-2)'
                }
              }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* CTA card */}
      <div className="mx-3 mt-6 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #2C52D8 0%, #1E3EAE 100%)' }}>
        <p className="text-white text-xs font-semibold leading-tight mb-3">
          Start a new project today
        </p>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-opacity bg-white"
          style={{ color: 'var(--pm-accent)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <Plus className="h-3 w-3" /> New Project
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <div className="p-3" style={{ borderTop: '1px solid var(--pm-sidebar-border)' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl" style={{ background: 'var(--pm-bg)' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: 'var(--pm-accent)', color: '#fff' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate leading-none" style={{ color: 'var(--pm-text)' }}>{displayName}</p>
            {userEmail && (
              <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--pm-text-3)' }}>
                {userEmail}
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex-shrink-0 p-1 rounded-lg transition-all"
            style={{ color: 'var(--pm-text-3)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.color = '#DC2626'
              ;(e.currentTarget as HTMLElement).style.background = '#FEF2F2'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.color = 'var(--pm-text-3)'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
