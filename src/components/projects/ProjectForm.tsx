'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectFormValues } from '@/lib/validations'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Project } from '@/types'
import { Loader2, Upload, X, ImagePlus } from 'lucide-react'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (project: Project) => void
  defaultValues?: Partial<ProjectFormValues>
  projectId?: string
}

const PALETTE = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#16A34A', '#0891B2', '#0F172A',
  '#6366F1', '#EC4899', '#F59E0B', '#10B981',
  '#64748B', '#8B5CF6', '#EF4444', '#06B6D4',
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  fontSize: '13px', background: 'var(--pm-bg)',
  border: '1px solid var(--pm-border)', color: 'var(--pm-text)',
  outline: 'none', transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--pm-text-3)', marginBottom: '6px',
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export default function ProjectForm({ open, onClose, onSuccess, defaultValues, projectId }: ProjectFormProps) {
  const [loading, setLoading]       = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    projectId ? `${SUPABASE_URL}/storage/v1/object/public/project-logos/${projectId}/logo` : null
  )
  const [logoFile, setLogoFile]     = useState<File | null>(null)
  const [logoLoaded, setLogoLoaded] = useState(!!projectId)
  const [removeLogo, setRemoveLogo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: { status: 'planning', color: '#2563EB', ...defaultValues },
  })

  const selectedColor = watch('color')
  const status = watch('status')

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--pm-accent)'
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--pm-border)'
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max logo size is 5 MB'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setLogoLoaded(true)
    setRemoveLogo(false)
  }

  function clearLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoLoaded(false)
    setRemoveLogo(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onSubmit(values: ProjectFormValues) {
    setLoading(true)
    const url    = projectId ? `/api/projects/${projectId}` : '/api/projects'
    const method = projectId ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to save project'); setLoading(false); return }

    const savedId = data.id

    // Upload logo if changed
    if (logoFile && savedId) {
      const form = new FormData()
      form.append('file', logoFile)
      await fetch(`/api/projects/${savedId}/logo`, { method: 'POST', body: form })
    } else if (removeLogo && savedId) {
      await fetch(`/api/projects/${savedId}/logo`, { method: 'DELETE' })
    }

    toast.success(projectId ? 'Project updated' : 'Project created')
    onSuccess(data)
    onClose()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--pm-card)', border: '1px solid var(--pm-border)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg" style={{ fontFamily: 'var(--font-sans)', color: 'var(--pm-text)' }}>
            {projectId ? 'Edit Project' : 'New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Logo upload */}
          <Field label="Project Logo">
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div
                className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-lg relative"
                style={{ background: logoLoaded ? 'transparent' : selectedColor + '20', border: `2px dashed ${selectedColor}50` }}
              >
                {logoPreview && logoLoaded ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                    onError={() => setLogoLoaded(false)}
                  />
                ) : (
                  <ImagePlus className="h-6 w-6" style={{ color: selectedColor + '80' }} />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'var(--pm-bg)', border: '1px solid var(--pm-border)', color: 'var(--pm-text-2)' }}
                >
                  <Upload className="h-3 w-3" /> Upload Logo
                </button>
                {logoLoaded && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ color: '#DC2626' }}
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
                <p className="text-[10px]" style={{ color: 'var(--pm-text-3)' }}>PNG, JPG, WebP · max 5 MB</p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={onLogoChange}
              />
            </div>
          </Field>

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
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input type="date" {...register('start_date')} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
            </Field>
            <Field label="End Date">
              <input type="date" {...register('end_date')} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
            </Field>
          </div>

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

          {/* Color palette */}
          <Field label="Accent Colour">
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: selectedColor === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: '2px',
                    boxShadow: selectedColor === c ? `0 0 0 1px white inset` : 'none',
                  }}
                  title={c}
                />
              ))}
              {/* Custom colour picker */}
              <label
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 text-[10px] font-bold"
                style={{ border: '1.5px dashed var(--pm-border)', color: 'var(--pm-text-3)' }}
                title="Custom colour"
              >
                +
                <input type="color" {...register('color')} className="sr-only" />
              </label>
            </div>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-opacity"
              style={{ background: 'var(--pm-accent)', color: '#fff', opacity: loading ? 0.7 : 1 }}
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
