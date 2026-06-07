import { createClient } from '@/lib/supabase/server'
import { FolderKanban, CheckSquare, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate, humanizeStatus } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  planning: '#6B7280', active: '#2563EB', on_hold: '#D97706',
  completed: '#16A34A', cancelled: '#DC2626',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: projects }, { data: tasks }, { data: overdueTasks }] = await Promise.all([
    supabase.from('projects').select('*, tasks(count)').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, status, project_id, projects!inner(owner_id)').eq('projects.owner_id', user!.id),
    supabase.from('tasks')
      .select('id, title, due_date, priority, project_id, projects!inner(name, owner_id)')
      .eq('projects.owner_id', user!.id)
      .neq('status', 'done').neq('status', 'cancelled')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .order('due_date').limit(5),
  ])

  const totalProjects = projects?.length ?? 0
  const activeProjects = projects?.filter((p) => p.status === 'active').length ?? 0
  const totalTasks = tasks?.length ?? 0
  const doneTasks = tasks?.filter((t) => t.status === 'done').length ?? 0
  const overdueCount = overdueTasks?.length ?? 0
  const overallCompletion = totalProjects > 0
    ? Math.round((projects ?? []).reduce((sum, p) => sum + Number(p.completion_pct), 0) / totalProjects)
    : 0

  const stats = [
    { label: 'Projects', value: totalProjects, icon: FolderKanban, color: '#2563EB' },
    { label: 'Active', value: activeProjects, icon: TrendingUp, color: '#16A34A' },
    { label: 'Tasks', value: totalTasks, icon: CheckSquare, color: '#7C3AED' },
    { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: overdueCount > 0 ? '#DC2626' : '#16A34A' },
  ]

  return (
    <div className="p-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-[2.6rem] leading-none mb-2"
          style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, color: 'var(--pm-text)' }}
        >
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--pm-text-3)' }}>
          Your workspace at a glance
        </p>
      </div>

      {/* Stat row — flat numbers, no card backgrounds */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-10 rounded-2xl overflow-hidden" style={{ background: 'var(--pm-border)', boxShadow: 'var(--pm-shadow-xs)' }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white px-6 py-6">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-4"
              style={{ background: color + '12' }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="stat-num text-4xl font-semibold mb-1" style={{ color: 'var(--pm-text)' }}>{value}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--pm-text-3)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Portfolio bar */}
      {totalProjects > 0 && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#fff', border: '1px solid var(--pm-border)' }}
        >
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--pm-text)' }}>Portfolio</p>
              <p className="text-xs" style={{ color: 'var(--pm-text-3)' }}>
                {doneTasks} of {totalTasks} tasks complete
              </p>
            </div>
            <span className="stat-num text-3xl font-medium" style={{ color: overallCompletion >= 70 ? 'var(--pm-success)' : 'var(--pm-accent)' }}>
              {overallCompletion}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${overallCompletion}%`,
                background: 'var(--pm-accent)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Two panels */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Projects */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--pm-border)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--pm-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--pm-text)' }}>Projects</p>
            <Link href="/projects" className="fp-link-view flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: 'var(--pm-text-3)' }}>
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--pm-border)' }}>
            {!projects?.length ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm mb-2" style={{ color: 'var(--pm-text-3)' }}>No projects yet</p>
                <Link href="/projects" className="text-xs font-semibold" style={{ color: 'var(--pm-accent-dark)' }}>
                  Create your first →
                </Link>
              </div>
            ) : (
              projects.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block">
                  <div className="fp-project-row flex items-center gap-4 px-6 py-4 transition-colors">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--pm-text)' }}>{p.name}</p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: STATUS_COLORS[p.status] + '14', color: STATUS_COLORS[p.status] }}
                        >
                          {humanizeStatus(p.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
                          <div className="h-full rounded-full" style={{ width: `${p.completion_pct}%`, background: 'var(--pm-accent)' }} />
                        </div>
                        <span className="stat-num text-[10px]" style={{ color: 'var(--pm-text-3)' }}>
                          {Math.round(p.completion_pct)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid var(--pm-border)' }}>
          <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid var(--pm-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--pm-text)' }}>Overdue</p>
            {overdueCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                {overdueCount}
              </span>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--pm-border)' }}>
            {!overdueTasks?.length ? (
              <div className="px-6 py-10 text-center">
                <p className="text-2xl mb-1">✓</p>
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--pm-text)' }}>All caught up</p>
                <p className="text-xs" style={{ color: 'var(--pm-text-3)' }}>No overdue tasks</p>
              </div>
            ) : (
              overdueTasks.map((t) => (
                <Link key={t.id} href={`/projects/${t.project_id}`} className="block">
                  <div className="fp-overdue-row flex items-center justify-between px-6 py-4 transition-colors gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--pm-text)' }}>{t.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pm-text-3)' }}>
                        {(t.projects as unknown as { name: string })?.name}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#DC2626' }}>
                      {formatDate(t.due_date)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
