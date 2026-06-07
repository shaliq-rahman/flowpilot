'use client'

import { useMemo } from 'react'
import { Task, Milestone, Project } from '@/types'
import { parseISO, differenceInDays, addDays, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TimelineViewProps {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  medium: '#2563EB',
  high: '#D97706',
  urgent: '#DC2626',
}

const MILESTONE_COLORS: Record<string, string> = {
  completed: '#16A34A',
  missed: '#DC2626',
  at_risk: '#D97706',
  upcoming: '#2563EB',
}

export default function TimelineView({ project, tasks, milestones }: TimelineViewProps) {
  const startDate = project.start_date ? parseISO(project.start_date) : new Date()
  const endDate = project.end_date ? parseISO(project.end_date) : addDays(new Date(), 90)
  const totalDays = Math.max(differenceInDays(endDate, startDate), 1)

  const months = useMemo(() => eachMonthOfInterval({ start: startDate, end: endDate }), [startDate, endDate])

  function pctFromDate(d: string | null) {
    if (!d) return null
    const days = differenceInDays(parseISO(d), startDate)
    return Math.max(0, Math.min(100, (days / totalDays) * 100))
  }

  const today = new Date()
  const todayPct = (differenceInDays(today, startDate) / totalDays) * 100
  const showToday = todayPct >= 0 && todayPct <= 100

  const visibleTasks = tasks.filter((t) => t.start_date || t.due_date)

  if (visibleTasks.length === 0 && milestones.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--pm-text-3)' }}>
        <p className="text-sm">Add tasks with start/due dates or milestones to see the timeline.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div style={{ minWidth: '600px' }}>
          {/* Month header */}
          <div className="flex mb-4 relative" style={{ borderBottom: '1px solid var(--pm-border)', paddingBottom: '8px' }}>
            {months.map((month) => {
              const mStart = Math.max(0, (differenceInDays(startOfMonth(month), startDate) / totalDays) * 100)
              const mEnd = Math.min(100, (differenceInDays(endOfMonth(month), startDate) / totalDays) * 100)
              const width = mEnd - mStart
              return (
                <div
                  key={month.toISOString()}
                  className="text-[10px] font-medium px-1 truncate"
                  style={{ width: `${width}%`, flexShrink: 0, color: 'var(--pm-text-3)', borderRight: '1px solid var(--pm-border)' }}
                >
                  {format(month, 'MMM yy')}
                </div>
              )
            })}
          </div>

          {/* Row area */}
          <div className="relative">
            {/* Column guides */}
            <div className="absolute inset-0 flex pointer-events-none">
              {months.map((month) => {
                const mStart = Math.max(0, (differenceInDays(startOfMonth(month), startDate) / totalDays) * 100)
                const mEnd = Math.min(100, (differenceInDays(endOfMonth(month), startDate) / totalDays) * 100)
                const width = mEnd - mStart
                return (
                  <div
                    key={month.toISOString()}
                    style={{
                      width: `${width}%`,
                      flexShrink: 0,
                      borderRight: '1px solid var(--pm-border)',
                      opacity: 0.5,
                    }}
                  />
                )
              })}
            </div>

            {/* Today line */}
            {showToday && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${todayPct}%`, width: '1px', background: '#DC2626' }}
              >
                <span
                  className="absolute text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                  style={{ top: 0, left: '3px', background: '#DC2626', color: '#fff' }}
                >
                  Today
                </span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {/* Task rows */}
              {visibleTasks.map((task) => {
                const leftPct = pctFromDate(task.start_date ?? task.due_date)
                const rightPct = pctFromDate(task.due_date ?? task.start_date)
                if (leftPct === null) return null
                const width = Math.max((rightPct ?? leftPct) - leftPct, 1)
                const barColor = PRIORITY_COLORS[task.priority] ?? '#6B7280'

                return (
                  <div key={task.id} className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 text-xs truncate"
                      style={{ width: '120px', color: 'var(--pm-text-2)' }}
                    >
                      {task.title}
                    </div>
                    <div className="flex-1 relative h-7">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1 h-5 rounded cursor-pointer overflow-hidden"
                            style={{
                              left: `${leftPct}%`,
                              width: `${width}%`,
                              minWidth: '6px',
                              background: barColor + '33',
                              border: `1px solid ${barColor}55`,
                            }}
                          >
                            {/* Fill */}
                            <div
                              className="h-full rounded transition-all"
                              style={{ width: `${task.completion_pct}%`, background: barColor }}
                            />
                            {width > 8 && (
                              <span
                                className="absolute inset-0 flex items-center px-1.5 text-[10px] font-semibold"
                                style={{ color: '#fff' }}
                              >
                                {Math.round(task.completion_pct)}%
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold text-xs">{task.title}</p>
                          <p className="text-[11px] opacity-70 capitalize">{task.status.replace('_', ' ')} · {Math.round(task.completion_pct)}%</p>
                          {task.due_date && <p className="text-[11px] opacity-70">Due: {task.due_date}</p>}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )
              })}

              {/* Milestone markers */}
              {milestones.map((m) => {
                const pct = pctFromDate(m.due_date)
                if (pct === null) return null
                const color = MILESTONE_COLORS[m.status] ?? '#2563EB'

                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 text-xs truncate italic"
                      style={{ width: '120px', color: 'var(--pm-text-3)' }}
                    >
                      {m.title}
                    </div>
                    <div className="flex-1 relative h-7">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute w-4 h-4 rotate-45 cursor-pointer"
                            style={{
                              left: `calc(${pct}% - 8px)`,
                              top: '6px',
                              background: color,
                              borderRadius: '2px',
                              boxShadow: `0 0 0 2px ${color}33`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold text-xs">{m.title}</p>
                          <p className="text-[11px] opacity-70 capitalize">{m.status} · Due: {m.due_date}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div
            className="flex items-center flex-wrap gap-4 mt-6 pt-4 text-[10px] font-medium"
            style={{ borderTop: '1px solid var(--pm-border)', color: 'var(--pm-text-3)' }}
          >
            {Object.entries(PRIORITY_COLORS).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5 capitalize">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rotate-45 rounded-sm inline-block" style={{ background: '#2563EB' }} />
              Milestone
            </span>
            {showToday && (
              <span className="flex items-center gap-1.5">
                <span className="w-px h-3 inline-block" style={{ background: '#DC2626' }} />
                Today
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
