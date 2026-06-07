'use client'

import { useState } from 'react'
import { Document } from '@/types'
import { FileText, FileSpreadsheet, Image, File, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import DocumentUpload from './DocumentUpload'
import DocumentViewer from './DocumentViewer'

interface DocumentListProps {
  projectId: string
  initialDocs: Document[]
}

function fileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="h-4 w-4" style={{ color: '#DC2626' }} />
  if (type.includes('word') || type.includes('document')) return <FileText className="h-4 w-4" style={{ color: '#2563EB' }} />
  if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4" style={{ color: '#16A34A' }} />
  if (type.startsWith('image/')) return <Image className="h-4 w-4" style={{ color: '#D97706' }} />
  return <File className="h-4 w-4" style={{ color: 'var(--pm-text-3)' }} />
}

function fileLabel(type: string) {
  if (type === 'application/pdf') return 'PDF'
  if (type.includes('wordprocessingml') || type === 'application/msword') return 'Word'
  if (type.includes('spreadsheetml') || type.includes('excel')) return 'Excel'
  if (type.startsWith('image/')) return type.split('/')[1].toUpperCase()
  return type.split('/').pop()?.toUpperCase() ?? 'FILE'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(2)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DocumentList({ projectId, initialDocs }: DocumentListProps) {
  const [docs, setDocs] = useState<Document[]>(initialDocs)
  const [viewing, setViewing] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function onUploaded(doc: Document) {
    setDocs((prev) => [doc, ...prev])
  }

  async function onDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document deleted')
    } else {
      toast.error('Failed to delete')
    }
    setDeleting(null)
  }

  return (
    <>
      <div className="space-y-4">
        <DocumentUpload projectId={projectId} onUploaded={onUploaded} />

        {docs.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--pm-text-3)' }}>
            No documents yet — upload one above.
          </p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--pm-border)' }}>
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors"
                style={{
                  borderTop: i > 0 ? '1px solid var(--pm-border)' : 'none',
                  background: 'var(--pm-card)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--pm-bg)' }}
                >
                  {fileIcon(doc.file_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--pm-text)' }}>{doc.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--pm-text-3)' }}>
                    {fileLabel(doc.file_type)} · {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setViewing(doc)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: 'var(--pm-accent-light)', color: 'var(--pm-accent)' }}
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                  <button
                    onClick={() => onDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--pm-text-3)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && <DocumentViewer doc={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
