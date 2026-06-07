'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { formatDate, humanizeStatus, isOverdue } from '@/lib/utils'
import { toast } from 'sonner'
import TaskForm from './TaskForm'

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280', medium: '#2563EB', high: '#D97706', urgent: '#DC2626',
}
const STATUS_COLORS: Record<string, string> = {
  backlog: '#6B7280', todo: '#2563EB', in_progress: '#7C3AED',
  in_review: '#D97706', done: '#16A34A', cancelled: '#DC2626',
}

interface TaskListProps {
  tasks: Task[]
  projectId: string
  onUpdate: () => void
}

const selectStyle = {
  background: 'var(--pm-card)',
  border: '1px solid var(--pm-border)',
  color: 'var(--pm-text-2)',
  borderRadius: '8px',
  padding: '6px 10px',
  fontSize: '12px',
  outline: 'none',
  cursor: 'pointer',
}

export default function TaskList({ tasks: initialTasks, projectId, onUpdate }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    return true
  })

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, completion_pct: newStatus === 'done' ? 100 : task.completion_pct }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)))
      onUpdate()
    }
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) { setTasks((prev) => prev.filter((t) => t.id !== id)); toast.success('Task deleted'); onUpdate() }
  }

  function handleTaskSaved(task: Task) {
    setTasks((prev) => editTask ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task])
    setEditTask(null)
    onUpdate()
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Status</option>
            {['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].map((s) => (
              <option key={s} value={s}>{humanizeStatus(s)}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Priority</option>
            {['low', 'medium', 'high', 'urgent'].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setEditTask(null); setFormOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--pm-accent)', color: '#000' }}
        >
          <Plus className="h-3.5 w-3.5" /> Add Task
        </button>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--pm-text-3)' }}>
            <p className="text-sm">No tasks yet. Add your first task.</p>
          </div>
        ) : (
          filtered.map((task) => {
            const priorityColor = PRIORITY_COLORS[task.priority] ?? '#6B7280'
            const statusColor = STATUS_COLORS[task.status] ?? '#6B7280'
            const done = task.status === 'done'
            const overdue = task.due_date && isOverdue(task.due_date) && !done

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: 'var(--pm-card)',
                  border: '1px solid var(--pm-border)',
                  borderLeft: `3px solid ${priorityColor}`,
                  opacity: done ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--pm-bg)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--pm-card)' }}
              >
                {/* Checkbox */}
                <button onClick={() => toggleDone(task)} className="flex-shrink-0 transition-transform hover:scale-110">
                  {done
                    ? <CheckCircle2 className="h-4.5 w-4.5" style={{ color: '#16A34A' }} />
                    : <Circle className="h-4.5 w-4.5" style={{ color: 'var(--pm-border-strong)' }} />
                  }
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: done ? 'var(--pm-text-3)' : 'var(--pm-text)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: statusColor + '18', color: statusColor }}
                    >
                      {humanizeStatus(task.status)}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: priorityColor + '18', color: priorityColor }}
                    >
                      {task.priority}
                    </span>
                    {overdue && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                        Overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 max-w-40">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
                        <div className="h-full rounded-full" style={{ width: `${task.completion_pct}%`, background: 'var(--pm-accent)' }} />
                      </div>
                      <span className="stat-num text-[11px] w-7" style={{ color: 'var(--pm-text-3)' }}>
                        {Math.round(task.completion_pct)}%
                      </span>
                    </div>
                    {task.due_date && (
                      <span className="text-[11px]" style={{ color: overdue ? '#DC2626' : 'var(--pm-text-3)' }}>
                        Due {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--pm-text-3)' }}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-sm">
                    <DropdownMenuItem onClick={() => { setEditTask(task); setFormOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })
        )}
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTask(null) }}
        onSuccess={handleTaskSaved}
        projectId={projectId}
        taskId={editTask?.id}
        defaultValues={editTask ? {
          title: editTask.title,
          description: editTask.description ?? undefined,
          status: editTask.status,
          priority: editTask.priority,
          due_date: editTask.due_date ?? undefined,
          start_date: editTask.start_date ?? undefined,
          completion_pct: editTask.completion_pct,
          estimated_hours: editTask.estimated_hours ?? undefined,
          project_id: projectId,
        } : undefined}
      />
    </div>
  )
}
