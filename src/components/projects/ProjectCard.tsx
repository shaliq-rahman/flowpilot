import Link from 'next/link'
import { formatDate, humanizeStatus } from '@/lib/utils'
import { CalendarDays, CheckSquare, Flag } from 'lucide-react'
import { Project } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  planning: '#6B7280', active: '#2563EB', on_hold: '#D97706',
  completed: '#16A34A', cancelled: '#DC2626',
}

interface ProjectCardProps {
  project: Project & { tasks?: [{ count: number }]; milestones?: [{ count: number }] }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const taskCount = (project.tasks as unknown as [{ count: number }])?.[0]?.count ?? 0
  const milestoneCount = (project.milestones as unknown as [{ count: number }])?.[0]?.count ?? 0
  const pct = Math.round(project.completion_pct)
  const statusColor = STATUS_COLORS[project.status] ?? '#6B7280'
  const barColor = pct >= 80 ? '#16A34A' : 'var(--pm-accent)'

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div
        className="rounded-2xl p-6 transition-all duration-200"
        style={{
          background: '#fff',
          border: '1px solid var(--pm-border)',
          boxShadow: 'var(--pm-shadow-xs)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = 'var(--pm-shadow-md)'
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = 'var(--pm-shadow-xs)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Colour + title */}
        <div className="flex items-start gap-3 mb-4">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
            style={{ background: project.color }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--pm-text)' }}>
              {project.name}
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ background: statusColor + '14', color: statusColor }}
            >
              {humanizeStatus(project.status)}
            </span>
          </div>
        </div>

        {project.description && (
          <p className="text-xs mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--pm-text-3)' }}>
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px]" style={{ color: 'var(--pm-text-3)' }}>Progress</span>
            <span className="stat-num text-[11px] font-semibold" style={{ color: barColor }}>{pct}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--pm-border)', paddingTop: '14px' }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--pm-text-3)' }}>
              <CheckSquare className="h-3 w-3" />
              <span className="stat-num">{taskCount}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--pm-text-3)' }}>
              <Flag className="h-3 w-3" />
              <span className="stat-num">{milestoneCount}</span>
            </span>
          </div>
          {project.end_date && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--pm-text-3)' }}>
              <CalendarDays className="h-3 w-3" />
              {formatDate(project.end_date)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
