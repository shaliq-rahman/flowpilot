'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2, LayoutGrid, List, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { formatDate, humanizeStatus, isOverdue } from '@/lib/utils'
import { toast } from 'sonner'
import TaskForm from './TaskForm'

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280', medium: '#2563EB', high: '#D97706', urgent: '#DC2626',
}

const COLUMNS = [
  { id: 'pending',    label: 'Pending',     statuses: ['backlog', 'todo'],           color: '#6B7280', bg: '#F3F4F6' },
  { id: 'inprogress', label: 'In Progress', statuses: ['in_progress', 'in_review'],  color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'completed',  label: 'Completed',   statuses: ['done'],                      color: '#16A34A', bg: '#F0FDF4' },
]

const DROP_STATUS: Record<string, string> = {
  pending: 'todo', inprogress: 'in_progress', completed: 'done',
}

interface TaskListProps {
  tasks: Task[]
  projectId: string
  onUpdate: () => void
  isAdmin?: boolean
}

export default function TaskList({ tasks: initialTasks, projectId, onUpdate, isAdmin = false }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  async function updateTask(id: string, patch: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
      onUpdate()
    }
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await updateTask(task.id, { status: newStatus, completion_pct: newStatus === 'done' ? 100 : task.completion_pct })
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) { setTasks(prev => prev.filter(t => t.id !== id)); toast.success('Task deleted'); onUpdate() }
  }

  function handleTaskSaved(task: Task) {
    setTasks(prev => editTask ? prev.map(t => t.id === task.id ? task : t) : [...prev, task])
    setEditTask(null)
    onUpdate()
  }

  async function handleDrop(colId: string) {
    if (!draggingId) return
    const newStatus = DROP_STATUS[colId]
    const task = tasks.find(t => t.id === draggingId)
    if (!task || task.status === newStatus) { setDraggingId(null); setDragOverCol(null); return }
    const patch: Partial<Task> = { status: newStatus as Task['status'] }
    if (newStatus === 'done') patch.completion_pct = 100
    // Optimistically update UI immediately for smooth feel
    setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, ...patch } : t))
    setDraggingId(null)
    setDragOverCol(null)
    const res = await fetch(`/api/tasks/${draggingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) { onUpdate() }
    else { toast.error('Failed to move task'); setTasks(prev => prev.map(t => t.id === task.id ? task : t)) }
  }

  // Render card as a function (not a nested component) to avoid remount on every render
  function renderCard(task: Task) {
    const priorityColor = PRIORITY_COLORS[task.priority] ?? '#6B7280'
    const done = task.status === 'done'
    const overdue = !!(task.due_date && isOverdue(task.due_date) && !done)

    return (
      <div
        key={task.id}
        draggable={isAdmin}
        onDragStart={(e) => { e.stopPropagation(); setDraggingId(task.id) }}
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
        className="rounded-xl p-3.5 select-none"
        style={{
          background: '#fff',
          border: '1px solid var(--pm-border)',
          borderLeft: `3px solid ${priorityColor}`,
          opacity: draggingId === task.id ? 0.35 : 1,
          cursor: isAdmin ? 'grab' : 'default',
          boxShadow: 'var(--pm-shadow-xs)',
          transition: 'opacity 0.15s',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <button
              onClick={() => toggleDone(task)}
              className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
            >
              {done
                ? <CheckCircle2 className="h-4 w-4" style={{ color: '#16A34A' }} />
                : <Circle className="h-4 w-4" style={{ color: 'var(--pm-text-3)' }} />
              }
            </button>
            <p
              className="text-sm font-medium leading-snug"
              style={{
                color: done ? 'var(--pm-text-3)' : 'var(--pm-text)',
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex-shrink-0 p-0.5 rounded" style={{ color: 'var(--pm-text-3)' }}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditTask(task); setFormOpen(true) }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => deleteTask(task.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
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
          {task.due_date && (
            <span className="text-[10px]" style={{ color: overdue ? '#DC2626' : 'var(--pm-text-3)' }}>
              Due {formatDate(task.due_date)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${task.completion_pct}%`, background: done ? '#16A34A' : 'var(--pm-accent)' }} />
          </div>
          <span className="text-[10px] w-6 text-right" style={{ color: 'var(--pm-text-3)' }}>{Math.round(task.completion_pct)}%</span>
        </div>

        {isAdmin && (
          <div className="flex gap-1 mt-2.5">
            {COLUMNS.filter(c => !c.statuses.includes(task.status)).map(col => (
              <button
                key={col.id}
                onClick={() => updateTask(task.id, {
                  status: DROP_STATUS[col.id] as Task['status'],
                  ...(col.id === 'completed' ? { completion_pct: 100 } : {}),
                })}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
                style={{ background: col.bg, color: col.color }}
              >
                <ChevronRight className="h-2.5 w-2.5" /> {col.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--pm-bg)', border: '1px solid var(--pm-border)' }}>
          {(['board', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? 'var(--pm-text)' : 'var(--pm-text-3)',
                boxShadow: view === v ? 'var(--pm-shadow-xs)' : 'none',
              }}
            >
              {v === 'board' ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => { setEditTask(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--pm-accent)', color: '#fff' }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
        )}
      </div>

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => col.statuses.includes(t.status))
            const isOver = dragOverCol === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault() }}
                onDragEnter={(e) => { e.preventDefault(); if (draggingId) setDragOverCol(col.id) }}
                onDragLeave={(e) => {
                  // Only clear if pointer truly left this column (not just moved to a child)
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null)
                }}
                onDrop={(e) => { e.preventDefault(); handleDrop(col.id) }}
                className="flex flex-col rounded-2xl p-3 min-h-[200px]"
                style={{
                  background: isOver ? col.bg : 'var(--pm-bg)',
                  border: `1.5px solid ${isOver ? col.color + '60' : 'var(--pm-border)'}`,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--pm-text)' }}>{col.label}</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: col.color + '18', color: col.color }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {colTasks.length === 0 ? (
                    <div
                      className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed py-8"
                      style={{ borderColor: isOver ? col.color + '60' : 'var(--pm-border)' }}
                    >
                      <p className="text-xs" style={{ color: 'var(--pm-text-3)' }}>
                        {isOver ? `Drop here` : 'No tasks'}
                      </p>
                    </div>
                  ) : (
                    colTasks.map(task => renderCard(task))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-1.5">
          {tasks.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--pm-text-3)' }}>
              <p className="text-sm">No tasks yet.</p>
            </div>
          ) : (
            tasks.map(task => {
              const priorityColor = PRIORITY_COLORS[task.priority] ?? '#6B7280'
              const done = task.status === 'done'
              const overdue = !!(task.due_date && isOverdue(task.due_date) && !done)

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: 'var(--pm-card)',
                    border: '1px solid var(--pm-border)',
                    borderLeft: `3px solid ${priorityColor}`,
                    opacity: done ? 0.65 : 1,
                  }}
                >
                  <button onClick={() => toggleDone(task)} className="flex-shrink-0 hover:scale-110 transition-transform">
                    {done
                      ? <CheckCircle2 className="h-4 w-4" style={{ color: '#16A34A' }} />
                      : <Circle className="h-4 w-4" style={{ color: 'var(--pm-text-3)' }} />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: done ? 'var(--pm-text-3)' : 'var(--pm-text)', textDecoration: done ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ background: priorityColor + '18', color: priorityColor }}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--pm-bg)', color: 'var(--pm-text-3)' }}>
                        {humanizeStatus(task.status)}
                      </span>
                      {overdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#FEF2F2', color: '#DC2626' }}>Overdue</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 w-32">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
                          <div className="h-full rounded-full" style={{ width: `${task.completion_pct}%`, background: 'var(--pm-accent)' }} />
                        </div>
                        <span className="text-[10px]" style={{ color: 'var(--pm-text-3)' }}>{Math.round(task.completion_pct)}%</span>
                      </div>
                      {task.due_date && <span className="text-[11px]" style={{ color: overdue ? '#DC2626' : 'var(--pm-text-3)' }}>Due {formatDate(task.due_date)}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded" style={{ color: 'var(--pm-text-3)' }}>
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTask(task); setFormOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {isAdmin && <TaskForm
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
      />}
    </div>
  )
}
