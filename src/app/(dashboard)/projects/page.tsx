'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectForm from '@/components/projects/ProjectForm'
import { Plus, Search, LayoutGrid, List, GanttChartSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { formatDate, humanizeStatus } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  planning:  { color: '#6B7280', bg: '#F3F4F6' },
  active:    { color: '#2563EB', bg: '#EFF6FF' },
  on_hold:   { color: '#D97706', bg: '#FFFBEB' },
  completed: { color: '#16A34A', bg: '#F0FDF4' },
  cancelled: { color: '#DC2626', bg: '#FEF2F2' },
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function logoUrl(id: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/project-logos/${id}/logo`
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function sortByEndDate(projects: Project[]) {
  return [...projects].sort((a, b) => {
    if (!a.end_date && !b.end_date) return 0
    if (!a.end_date) return 1
    if (!b.end_date) return -1
    return a.end_date.localeCompare(b.end_date)
  })
}

// ── Timeline View ──────────────────────────────────────────────────────────

function TimelineView({ projects }: { projects: Project[] }) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  const dated = projects.filter(p => p.start_date || p.end_date)
  const undated = projects.filter(p => !p.start_date && !p.end_date)

  if (dated.length === 0 && undated.length === 0) return (
    <p className="text-sm text-center py-16" style={{ color: 'var(--pm-text-3)' }}>No projects to display.</p>
  )

  // Compute overall range
  const allDates = dated.flatMap(p => [p.start_date, p.end_date].filter(Boolean) as string[])
  const minDate = allDates.reduce((a, b) => (a < b ? a : b))
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b))

  const rangeStart = new Date(minDate)
  const rangeEnd   = new Date(maxDate)
  // Pad by 7 days each side for breathing room
  rangeStart.setDate(rangeStart.getDate() - 7)
  rangeEnd.setDate(rangeEnd.getDate() + 7)
  const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / 86400000

  function pct(dateStr: string) {
    const d = new Date(dateStr)
    return Math.min(100, Math.max(0, (d.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime()) * 100))
  }

  // Generate month markers
  const months: { label: string; pct: number }[] = []
  const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cur <= rangeEnd) {
    const p = (cur.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime()) * 100
    if (p >= 0 && p <= 100) {
      months.push({
        label: cur.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        pct: p,
      })
    }
    cur.setMonth(cur.getMonth() + 1)
  }

  // Today marker
  const todayPct = (new Date().getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime()) * 100
  const showToday = todayPct >= 0 && todayPct <= 100

  return (
    <div className="space-y-2">
      {/* Month header */}
      <div className="relative h-7 mb-1 ml-[220px]">
        {months.map(m => (
          <div
            key={m.label}
            className="absolute top-0 text-[10px] font-semibold"
            style={{ left: `${m.pct}%`, color: 'var(--pm-text-3)', transform: 'translateX(-50%)' }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Grid lines + rows */}
      <div className="relative">
        {/* Month grid lines */}
        <div className="absolute inset-0 ml-[220px] pointer-events-none">
          {months.map(m => (
            <div
              key={m.label}
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${m.pct}%`, background: 'var(--pm-border)' }}
            />
          ))}
          {/* Today line */}
          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-0.5 z-10"
              style={{ left: `${todayPct}%`, background: '#DC2626', opacity: 0.7 }}
            />
          )}
        </div>

        <div className="space-y-2">
          {dated.map(p => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning
            const start = p.start_date ? pct(p.start_date) : (p.end_date ? pct(p.end_date) - 2 : 0)
            const end   = p.end_date   ? pct(p.end_date)   : (p.start_date ? pct(p.start_date) + 2 : 100)
            const width = Math.max(end - start, 1.5)
            const hasErr = logoErrors[p.id]

            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-0 group">
                {/* Project label */}
                <div className="w-[220px] flex-shrink-0 flex items-center gap-2.5 pr-4">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: hasErr ? p.color : '#f0f0f0', border: '1.5px solid #000' }}
                  >
                    {!hasErr ? (
                      <img
                        src={logoUrl(p.id)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={() => setLogoErrors(prev => ({ ...prev, [p.id]: true }))}
                      />
                    ) : getInitials(p.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#000' }}>{p.name}</p>
                    <span
                      className="text-[9px] px-1.5 py-px rounded-full font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {humanizeStatus(p.status)}
                    </span>
                  </div>
                </div>

                {/* Bar track */}
                <div className="flex-1 relative h-10 flex items-center">
                  {/* Bar */}
                  <div
                    className="absolute h-7 rounded-lg flex items-center px-2.5 overflow-hidden transition-all group-hover:h-8"
                    style={{
                      left: `${start}%`,
                      width: `${width}%`,
                      background: p.color,
                      border: '1.5px solid #000',
                      minWidth: '6px',
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {p.start_date && (
                        <span className="text-[9px] font-semibold text-white/90 whitespace-nowrap hidden sm:block">
                          {formatDate(p.start_date)}
                        </span>
                      )}
                      {p.start_date && p.end_date && (
                        <span className="text-[9px] text-white/60 hidden sm:block">→</span>
                      )}
                      {p.end_date && (
                        <span className="text-[9px] font-semibold text-white/90 whitespace-nowrap hidden sm:block">
                          {formatDate(p.end_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Today label */}
      {showToday && (
        <div className="relative ml-[220px] h-4">
          <div
            className="absolute text-[9px] font-bold"
            style={{ left: `${todayPct}%`, color: '#DC2626', transform: 'translateX(-50%)' }}
          >
            Today
          </div>
        </div>
      )}

      {/* Undated projects */}
      {undated.length > 0 && (
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--pm-border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--pm-text-3)' }}>
            No dates set
          </p>
          <div className="flex flex-wrap gap-2">
            {undated.map(p => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning
              return (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: '#fff', border: '1.5px solid #000',
                      color: '#000',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}
                    <span className="text-[9px] px-1.5 py-px rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                      {humanizeStatus(p.status)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── List View ──────────────────────────────────────────────────────────────

function ListView({ projects }: { projects: Project[] }) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-2">
      {projects.map(p => {
        const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning
        const pct = Math.round(p.completion_pct)
        const hasErr = logoErrors[p.id]
        return (
          <Link key={p.id} href={`/projects/${p.id}`} className="block">
            <div
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
              style={{ background: '#fff', border: '1.5px solid #000' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 #000'; (e.currentTarget as HTMLElement).style.transform = 'translate(-1px,-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translate(0,0)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold"
                style={{ background: hasErr ? p.color : '#f0f0f0', border: '1.5px solid #000' }}
              >
                {!hasErr ? (
                  <img src={logoUrl(p.id)} alt={p.name} className="w-full h-full object-cover"
                    onError={() => setLogoErrors(prev => ({ ...prev, [p.id]: true }))} />
                ) : getInitials(p.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#000' }}>{p.name}</p>
                {p.description && <p className="text-xs truncate text-gray-400">{p.description}</p>}
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}>{humanizeStatus(p.status)}</span>

              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 w-40">
                <span className="font-medium" style={{ color: p.color }}>{p.start_date ? formatDate(p.start_date) : '—'}</span>
                <span className="mx-1">→</span>
                <span className="font-medium" style={{ color: p.color }}>{p.end_date ? formatDate(p.end_date) : 'Ongoing'}</span>
              </div>

              <div className="hidden md:flex items-center gap-2 w-28 flex-shrink-0">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <span className="text-[10px] font-bold w-7 text-right" style={{ color: p.color }}>{pct}%</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

type View = 'grid' | 'list' | 'timeline'

export default function ProjectsPage() {
  const { isAdmin } = useAuth()
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [formOpen, setFormOpen]   = useState(false)
  const [view, setView]           = useState<View>('grid')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = sortByEndDate(
    projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const VIEWS: { id: View; icon: React.ReactNode; label: string }[] = [
    { id: 'grid',     icon: <LayoutGrid className="h-3.5 w-3.5" />,       label: 'Grid' },
    { id: 'list',     icon: <List className="h-3.5 w-3.5" />,             label: 'List' },
    { id: 'timeline', icon: <GanttChartSquare className="h-3.5 w-3.5" />, label: 'Timeline' },
  ]

  return (
    <div className="p-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[2.6rem] leading-none mb-2"
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, color: 'var(--pm-text)' }}>
            Projects
          </h1>
          <p className="text-sm" style={{ color: 'var(--pm-text-3)' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} · sorted by deadline
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setFormOpen(true)} className="fp-btn fp-btn-amber">
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--pm-text-3)' }} />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white"
            style={{ border: '1px solid var(--pm-border)', color: 'var(--pm-text)' }}
            onFocus={e => { e.target.style.borderColor = 'var(--pm-accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--pm-border)' }}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
          style={{ background: 'var(--pm-bg)', border: '1px solid var(--pm-border)' }}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: view === v.id ? '#fff' : 'transparent',
                color: view === v.id ? 'var(--pm-text)' : 'var(--pm-text-3)',
                boxShadow: view === v.id ? 'var(--pm-shadow-xs)' : 'none',
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'var(--pm-border)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--pm-text)' }}>
            {search ? 'No matching projects' : 'No projects yet'}
          </p>
          <p className="text-xs mb-5" style={{ color: 'var(--pm-text-3)' }}>
            {search ? 'Try a different search term' : 'No projects available'}
          </p>
          {!search && isAdmin && (
            <button onClick={() => setFormOpen(true)} className="fp-btn fp-btn-amber">
              <Plus className="h-4 w-4" /> New Project
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p as Parameters<typeof ProjectCard>[0]['project']} />
          ))}
        </div>
      ) : view === 'list' ? (
        <ListView projects={filtered} />
      ) : (
        <TimelineView projects={filtered} />
      )}

      {isAdmin && (
        <ProjectForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  )
}
