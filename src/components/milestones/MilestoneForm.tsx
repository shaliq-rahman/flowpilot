'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { milestoneSchema, MilestoneFormValues } from '@/lib/validations'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Milestone } from '@/types'
import { Loader2 } from 'lucide-react'

interface MilestoneFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (milestone: Milestone) => void
  projectId: string
  defaultValues?: Partial<MilestoneFormValues>
  milestoneId?: string
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

export default function MilestoneForm({ open, onClose, onSuccess, projectId, defaultValues, milestoneId }: MilestoneFormProps) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { project_id: projectId, ...defaultValues },
  })

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'var(--pm-accent)'
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'var(--pm-border)'
  }

  async function onSubmit(values: MilestoneFormValues) {
    setLoading(true)
    const url = milestoneId ? `/api/milestones/${milestoneId}` : '/api/milestones'
    const method = milestoneId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to save milestone')
    } else {
      toast.success(milestoneId ? 'Milestone updated' : 'Milestone created')
      onSuccess(data)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{ background: 'var(--pm-card)', border: '1px solid var(--pm-border)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-lg"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--pm-text)' }}
          >
            {milestoneId ? 'Edit Milestone' : 'New Milestone'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <Field label="Title *" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="Milestone title"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <Field label="Description">
            <textarea
              {...register('description')}
              placeholder="Optional notes…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <Field label="Due Date *" error={errors.due_date?.message}>
            <input
              type="date"
              {...register('due_date')}
              style={inputStyle}
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
              {loading ? 'Saving…' : milestoneId ? 'Save Changes' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
