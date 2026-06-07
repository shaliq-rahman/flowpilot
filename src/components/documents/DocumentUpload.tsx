'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Document } from '@/types'

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp'

interface DocumentUploadProps {
  projectId: string
  onUploaded: (doc: Document) => void
}

export default function DocumentUpload({ projectId, onUploaded }: DocumentUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (file.size > 52428800) { toast.error('File too large (max 50 MB)'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('project_id', projectId)
    const res = await fetch('/api/documents', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Upload failed') }
    else { toast.success(`${file.name} uploaded`); onUploaded(data) }
    setUploading(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-8"
      style={{
        borderColor: dragging ? 'var(--pm-accent)' : 'var(--pm-border)',
        background: dragging ? 'var(--pm-accent-light)' : 'transparent',
      }}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onChange} />
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--pm-accent)' }} />
      ) : (
        <Upload className="h-6 w-6" style={{ color: 'var(--pm-text-3)' }} />
      )}
      <p className="text-sm font-medium" style={{ color: 'var(--pm-text-2)' }}>
        {uploading ? 'Uploading…' : 'Drop a file or click to browse'}
      </p>
      <p className="text-xs" style={{ color: 'var(--pm-text-3)' }}>PDF, Word, Excel, images — up to 50 MB</p>
    </div>
  )
}
