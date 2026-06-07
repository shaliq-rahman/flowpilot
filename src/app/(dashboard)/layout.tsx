import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--pm-bg)' }}>
      <Sidebar userEmail={profile?.email ?? user.email} userName={profile?.full_name ?? undefined} />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--pm-bg)' }}>
        {children}
      </main>
    </div>
  )
}
