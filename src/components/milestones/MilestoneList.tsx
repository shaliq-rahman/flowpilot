'use client'

import { useState } from 'react'
import { Milestone } from '@/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import MilestoneForm from './MilestoneForm'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  upcoming:  { color: '#2563EB', bg: '#EFF6FF', label: 'Upcoming' },
  at_risk:   { color: '#D97706', bg: '#FFFBEB', label: 'At Risk' },
  completed: { color: '#16A34A', bg: '#F0FDF4', label: 'Completed' },
  missed:    { color: '#DC2626', bg: '#FEF2F2', label: 'Missed' },
}

interface MilestoneListProps {
  milestones: Milestone[]
  projectId: string
  onUpdate: () => void
  isAdmin?: boolean
}

export default function MilestoneList({ milestones: initial, projectId, onUpdate, isAdmin = false }: MilestoneListProps) {
  const [milestones, setMilestones] = useState(initial)
  const [formOpen, setFormOpen] = useState(false)
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null)

  async function toggleComplete(m: Milestone) {
    const newStatus = m.status === 'completed' ? 'upcoming' : 'completed'
    const res = await fetch(`/api/milestones/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMilestones((prev) => prev.map((ms) => (ms.id === m.id ? updated : ms)))
    }
  }

  async function deleteMilestone(id: string) {
    const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMilestones((prev) => prev.filter((m) => m.id !== id))
      toast.success('Milestone deleted')
      onUpdate()
    }
  }

  function handleSaved(m: Milestone) {
    setMilestones((prev) => editMilestone
      ? prev.map((ms) => (ms.id === m.id ? m : ms))
      : [...prev, m].sort((a, b) => a.due_date.localeCompare(b.due_date))
    )
    setEditMilestone(null)
    onUpdate()
  }

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setEditMilestone(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--pm-accent)', color: '#fff' }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Milestone
          </button>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-10" style={{ color: 'var(--pm-text-3)' }}>
          <p className="text-sm">No milestones yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[19px] top-2 bottom-2 w-px"
            style={{ background: 'var(--pm-border)' }}
          />

          <div className="space-y-3">
            {milestones.map((m) => {
              const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.upcoming
              const done = m.status === 'completed'

              return (
                <div key={m.id} className="flex items-start gap-4 relative" style={{ opacity: done ? 0.65 : 1 }}>
                  {/* Status dot */}
                  <button
                    onClick={() => toggleComplete(m)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-transform hover:scale-110"
                    style={{ background: cfg.bg, border: `2px solid ${cfg.color}` }}
                  >
                    {done
                      ? <svg className="w-4 h-4" fill={cfg.color} viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    }
                  </button>

                  {/* Card */}
                  <div
                    className="flex-1 flex items-center justify-between p-4 rounded-xl"
                    style={{
                      background: 'var(--pm-card)',
                      border: '1px solid var(--pm-border)',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: done ? 'var(--pm-text-3)' : 'var(--pm-text)',
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {m.title}
                      </p>
                      {m.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--pm-text-2)' }}>{m.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <p className="text-xs font-medium stat-num" style={{ color: 'var(--pm-text)' }}>
                          {formatDate(m.due_date)}
                        </p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded" style={{ color: 'var(--pm-text-3)' }}>
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditMilestone(m); setFormOpen(true) }}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteMilestone(m.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isAdmin && <MilestoneForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditMilestone(null) }}
        onSuccess={handleSaved}
        projectId={projectId}
        milestoneId={editMilestone?.id}
        defaultValues={editMilestone ? {
          title: editMilestone.title,
          description: editMilestone.description ?? undefined,
          due_date: editMilestone.due_date,
          project_id: projectId,
        } : undefined}
      />}
    </div>
  )
}
