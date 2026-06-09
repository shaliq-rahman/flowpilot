'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDate, humanizeStatus } from '@/lib/utils'
import { CheckSquare, Flag, CalendarRange } from 'lucide-react'
import { Project } from '@/types'
import { useState } from 'react'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  planning:  { color: '#6B7280', bg: '#F3F4F6', label: 'Planning' },
  active:    { color: '#2563EB', bg: '#EFF6FF', label: 'Active' },
  on_hold:   { color: '#D97706', bg: '#FFFBEB', label: 'On Hold' },
  completed: { color: '#16A34A', bg: '#F0FDF4', label: 'Completed' },
  cancelled: { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled' },
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

interface ProjectCardProps {
  project: Project & { tasks?: [{ count: number }]; milestones?: [{ count: number }] }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function logoUrl(projectId: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/project-logos/${projectId}/logo`
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [logoErr, setLogoErr] = useState(false)
  const taskCount      = (project.tasks as unknown as [{ count: number }])?.[0]?.count ?? 0
  const milestoneCount = (project.milestones as unknown as [{ count: number }])?.[0]?.count ?? 0
  const pct         = Math.round(project.completion_pct)
  const cfg         = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning
  const barColor    = pct >= 80 ? '#16A34A' : project.color
  const accent      = project.color

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: '#fff',
          border: '1px solid var(--pm-border)',
          boxShadow: 'var(--pm-shadow-xs)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10)'
          el.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = 'var(--pm-shadow-xs)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Colour accent bar */}
        <div className="h-1 w-full" style={{ background: accent }} />

        <div className="p-5">
          {/* Logo + name row */}
          <div className="flex items-center gap-3.5 mb-4">
            {/* Logo / Avatar */}
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold"
              style={{ background: logoErr ? accent : 'transparent', border: `1.5px solid ${accent}20` }}
            >
              {!logoErr ? (
                <img
                  src={logoUrl(project.id)}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  onError={() => setLogoErr(true)}
                />
              ) : (
                <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {getInitials(project.name)}
                </span>
              )}
            </div>

            {/* Name + status */}
            <div className="min-w-0 flex-1">
              <h3
                className="font-bold leading-tight mb-1 truncate"
                style={{ fontSize: '1rem', color: 'var(--pm-text)', letterSpacing: '-0.01em' }}
              >
                {project.name}
              </h3>
              <span
                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <p
              className="text-xs mb-4 line-clamp-2 leading-relaxed"
              style={{ color: 'var(--pm-text-3)' }}
            >
              {project.description}
            </p>
          )}

          {/* Date range — highlighted */}
          {(project.start_date || project.end_date) && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-medium"
              style={{ background: accent + '0d', border: `1px solid ${accent}25` }}
            >
              <CalendarRange className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent }} />
              <span style={{ color: accent }}>
                {project.start_date ? formatDate(project.start_date) : '—'}
                {' → '}
                {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
              </span>
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium" style={{ color: 'var(--pm-text-3)' }}>Progress</span>
              <span className="text-[11px] font-bold" style={{ color: barColor }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: accent + '18' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
          </div>

          {/* Footer counts */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: `1px solid ${accent}20` }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--pm-text-3)' }}>
                <CheckSquare className="h-3 w-3" style={{ color: accent }} />
                <span className="stat-num">{taskCount}</span> tasks
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--pm-text-3)' }}>
                <Flag className="h-3 w-3" style={{ color: accent }} />
                <span className="stat-num">{milestoneCount}</span> milestones
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
