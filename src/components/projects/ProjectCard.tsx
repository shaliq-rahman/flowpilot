'use client'

import { formatDate } from '@/lib/utils'
import { CheckSquare, Flag, CalendarRange } from 'lucide-react'
import { Project } from '@/types'
import { useState } from 'react'
import Link from 'next/link'

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
  const pct     = Math.round(project.completion_pct)
  const cfg     = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning
  const accent  = project.color
  const barColor = pct >= 80 ? '#16A34A' : accent

  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <div
        className="rounded-2xl h-full flex flex-col transition-all duration-200 cursor-pointer"
        style={{
          background: '#fff',
          border: '1.5px solid #000',
          boxShadow: 'none',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px #000'
          ;(e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLElement).style.transform = 'translate(0,0)'
        }}
      >
        <div className="p-5 flex flex-col flex-1">

          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-4">
            {/* Rounded logo / initials */}
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: logoErr ? accent : '#f0f0f0',
                border: '1.5px solid #000',
              }}
            >
              {!logoErr ? (
                <img
                  src={logoUrl(project.id)}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  onError={() => setLogoErr(true)}
                />
              ) : (
                <span style={{ color: '#fff', fontSize: '13px' }}>{getInitials(project.name)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className="font-bold leading-tight truncate"
                style={{ fontSize: '1rem', color: '#000', letterSpacing: '-0.01em' }}
              >
                {project.name}
              </h3>
              <span
                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Description — always 2 lines reserved so cards stay same height */}
          <p
            className="text-xs leading-relaxed mb-4 line-clamp-2"
            style={{ color: '#666', minHeight: '2.5em' }}
          >
            {project.description ?? ''}
          </p>

          {/* Date range */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium"
            style={{ background: '#F8F8F8', border: '1px solid #E5E5E5' }}
          >
            <CalendarRange className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span style={{ color: '#444' }}>
              {project.start_date ? formatDate(project.start_date) : '—'}
              <span className="mx-1.5 text-gray-300">→</span>
              {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
            </span>
          </div>

          {/* Progress — pushed to bottom */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-gray-400">Progress</span>
              <span className="text-[11px] font-bold" style={{ color: barColor }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <CheckSquare className="h-3 w-3" />
                <span className="stat-num">{taskCount}</span> tasks
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <Flag className="h-3 w-3" />
                <span className="stat-num">{milestoneCount}</span> milestones
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
