'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, TaskFormValues } from '@/lib/validations'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Task } from '@/types'
import { Loader2 } from 'lucide-react'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (task: Task) => void
  projectId: string
  defaultValues?: Partial<TaskFormValues>
  taskId?: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  background: 'var(--pm-bg)',
  border: '1px solid var(--pm-border)',
  color: 'var(--pm-text)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--pm-text-3)',
  marginBottom: '6px',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}

export default function TaskForm({ open, onClose, onSuccess, projectId, defaultValues, taskId }: TaskFormProps) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { status: 'todo', priority: 'medium', completion_pct: 0, project_id: projectId, ...defaultValues },
  })

  const status = watch('status')
  const priority = watch('priority')
  const completionPct = watch('completion_pct')

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--pm-accent)'
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--pm-border)'
  }

  async function onSubmit(values: TaskFormValues) {
    setLoading(true)
    const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks'
    const method = taskId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to save task')
    } else {
      toast.success(taskId ? 'Task updated' : 'Task created')
      onSuccess(data)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg"
        style={{ background: 'var(--pm-card)', border: '1px solid var(--pm-border)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-lg"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--pm-text)' }}
          >
            {taskId ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <Field label="Title *" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="Task title"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <Field label="Description">
            <textarea
              {...register('description')}
              placeholder="Describe the task…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setValue('status', e.target.value as TaskFormValues['status'])}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setValue('priority', e.target.value as TaskFormValues['priority'])}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input
                type="date"
                {...register('start_date')}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </Field>
            <Field label="Due Date">
              <input
                type="date"
                {...register('due_date')}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </Field>
          </div>

          <Field label={`Completion: ${completionPct}%`}>
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={completionPct}
                onChange={(e) => setValue('completion_pct', Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: 'var(--pm-accent)' }}
              />
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--pm-bg-subtle)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${completionPct}%`, background: 'var(--pm-accent)' }}
                />
              </div>
            </div>
          </Field>

          <Field label="Est. Hours">
            <input
              type="number"
              step="0.5"
              placeholder="0"
              {...register('estimated_hours', { valueAsNumber: true })}
              style={{ ...inputStyle, maxWidth: '50%' }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--pm-bg)', border: '1px solid var(--pm-border)', color: 'var(--pm-text-2)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--pm-accent)', color: '#000', opacity: loading ? 0.7 : 1 }}
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              {loading ? 'Saving…' : taskId ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
