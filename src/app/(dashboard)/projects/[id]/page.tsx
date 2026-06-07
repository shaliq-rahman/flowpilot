'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Project, Task, Milestone } from '@/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDate, humanizeStatus } from '@/lib/utils'
import { toast } from 'sonner'
import TaskList from '@/components/tasks/TaskList'
import MilestoneList from '@/components/milestones/MilestoneList'
import TimelineView from '@/components/timeline/TimelineView'
import ProjectForm from '@/components/projects/ProjectForm'
import AIAssistantPanel from '@/components/ai/AIAssistantPanel'

const STATUS_COLORS: Record<string, string> = {
  planning: '#6B7280', active: '#2563EB', on_hold: '#D97706',
  completed: '#16A34A', cancelled: '#DC2626',
}

const TABS = ['tasks', 'milestones', 'timeline'] as const
type Tab = typeof TABS[number]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('tasks')

  async function loadProject() {
    const res = await fetch(`/api/projects/${id}`)
    if (!res.ok) { router.push('/projects'); return }
    const data = await res.json()
    setProject(data)
    setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    setMilestones(Array.isArray(data.milestones) ? data.milestones : [])
    setLoading(false)
  }

  useEffect(() => { loadProject() }, [id])

  async function handleDelete() {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Project deleted'); router.push('/projects') }
    else toast.error('Failed to delete project')
  }

  async function handleApplyAITasks(aiTasks: Array<{ title: string; description: string; priority: string; estimatedDays: number }>) {
    let added = 0
    for (const t of aiTasks) {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t.title, description: t.description, priority: t.priority, project_id: id, status: 'todo', completion_pct: 0 }),
      })
      if (res.ok) { const task = await res.json(); setTasks((prev) => [...prev, task]); added++ }
    }
    toast.success(`Added ${added} tasks from AI suggestions`)
    loadProject()
  }

  if (loading) {
    return (
      <div className="p-10 max-w-5xl mx-auto space-y-4">
        {[56, 96, 400].map((h, i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: 'var(--pm-border)' }} />
        ))}
      </div>
    )
  }

  if (!project) return null

  const pct = Math.round(project.completion_pct)
  const statusColor = STATUS_COLORS[project.status] ?? '#6B7280'
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const doneMilestones = milestones.filter((m) => m.status === 'completed').length
  const barColor = pct >= 80 ? '#16A34A' : 'var(--pm-accent)'

  const stats = [
    { label: 'Completion', value: `${pct}%`, note: null },
    { label: 'Tasks', value: tasks.length, note: `${doneTasks} done` },
    { label: 'Milestones', value: milestones.length, note: `${doneMilestones} done` },
    { label: 'Deadline', value: formatDate(project.end_date), note: formatDate(project.start_date) },
  ]

  return (
    <div className="p-10 max-w-5xl mx-auto">

      {/* Back + title */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link
            href="/projects"
            className="mt-1 p-1.5 rounded-xl transition-colors flex-shrink-0"
            style={{ border: '1px solid var(--pm-border)', color: 'var(--pm-text-3)', background: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pm-border-mid)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pm-border)' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: project.color }} />
              <h1
                className="text-[2.2rem] leading-none"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, color: 'var(--pm-text)' }}
              >
                {project.name}
              </h1>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: statusColor + '14', color: statusColor }}
              >
                {humanizeStatus(project.status)}
              </span>
            </div>
            {project.description && (
              <p className="text-sm mt-2 leading-relaxed max-w-lg" style={{ color: 'var(--pm-text-3)' }}>
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ border: '1px solid var(--pm-border)', color: 'var(--pm-text-2)', background: '#fff' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--pm-accent)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--pm-accent-dark)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--pm-border)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--pm-text-2)'
            }}
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-xl transition-colors"
                style={{ border: '1px solid var(--pm-border)', color: 'var(--pm-text-3)', background: '#fff' }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stat strip */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-8 rounded-2xl overflow-hidden"
        style={{ background: 'var(--pm-border)', boxShadow: 'var(--pm-shadow-xs)' }}
      >
        {stats.map(({ label, value, note }, i) => (
          <div key={label} className="bg-white px-5 py-5">
            {i === 0 && (
              <div className="h-0.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--pm-bg-subtle)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            )}
            <p className="stat-num text-2xl font-semibold mb-0.5" style={{ color: i === 0 ? barColor : 'var(--pm-text)' }}>{value}</p>
            <p className="text-[11px] font-medium" style={{ color: 'var(--pm-text-3)' }}>{label}</p>
            {note && <p className="text-[10px] mt-0.5" style={{ color: 'var(--pm-text-3)', opacity: 0.7 }}>{note}</p>}
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6">
        {TABS.map((t) => {
          const active = tab === t
          const label = t === 'tasks' ? `Tasks (${tasks.length})`
            : t === 'milestones' ? `Milestones (${milestones.length})`
            : 'Timeline'
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: active ? '#fff' : 'transparent',
                border: active ? '1px solid var(--pm-border)' : '1px solid transparent',
                color: active ? 'var(--pm-text)' : 'var(--pm-text-3)',
                boxShadow: active ? 'var(--pm-shadow-xs)' : 'none',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'tasks' && <TaskList tasks={tasks} projectId={id} onUpdate={loadProject} />}
      {tab === 'milestones' && <MilestoneList milestones={milestones} projectId={id} onUpdate={loadProject} />}
      {tab === 'timeline' && (
        <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid var(--pm-border)' }}>
          <p className="text-sm font-semibold mb-6" style={{ color: 'var(--pm-text)' }}>Timeline</p>
          <TimelineView project={project} tasks={tasks} milestones={milestones} />
        </div>
      )}

      <ProjectForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(p) => setProject(p)}
        projectId={id}
        defaultValues={{
          name: project.name,
          description: project.description ?? undefined,
          status: project.status,
          start_date: project.start_date ?? undefined,
          end_date: project.end_date ?? undefined,
          color: project.color,
        }}
      />

      <AIAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        project={project}
        tasks={tasks}
        milestones={milestones}
        onApplyTasks={handleApplyAITasks}
      />
    </div>
  )
}
