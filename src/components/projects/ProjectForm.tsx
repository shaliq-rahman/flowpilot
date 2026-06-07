'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectFormValues } from '@/lib/validations'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Project } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (project: Project) => void
  defaultValues?: Partial<ProjectFormValues>
  projectId?: string
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

export default function ProjectForm({ open, onClose, onSuccess, defaultValues, projectId }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: { status: 'planning', color: '#6366f1', ...defaultValues },
  })

  const status = watch('status')

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--pm-accent)'
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--pm-border)'
  }

  async function onSubmit(values: ProjectFormValues) {
    setLoading(true)
    const url = projectId ? `/api/projects/${projectId}` : '/api/projects'
    const method = projectId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to save project')
    } else {
      toast.success(projectId ? 'Project updated' : 'Project created')
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
            {projectId ? 'Edit Project' : 'New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <Field label="Name *" error={errors.name?.message}>
            <input
              {...register('name')}
              placeholder="Project name"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <Field label="Description">
            <textarea
              {...register('description')}
              placeholder="What is this project about?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

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
            <Field label="End Date">
              <input
                type="date"
                {...register('end_date')}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setValue('status', e.target.value as ProjectFormValues['status'])}
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Color">
              <input
                type="color"
                {...register('color')}
                style={{ ...inputStyle, padding: '4px 8px', height: '36px', cursor: 'pointer' }}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'var(--pm-bg)', border: '1px solid var(--pm-border)', color: 'var(--pm-text-2)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-opacity"
              style={{ background: 'var(--pm-accent)', color: '#000', opacity: loading ? 0.7 : 1 }}
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              {loading ? 'Saving…' : projectId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
