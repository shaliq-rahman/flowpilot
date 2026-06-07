'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Download } from 'lucide-react'
import { Document } from '@/types'

interface DocumentViewerProps {
  doc: Document
  onClose: () => void
}

function isPDF(type: string) { return type === 'application/pdf' }
function isDOCX(type: string) {
  return type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword'
}
function isImage(type: string) { return type.startsWith('image/') }
function isText(type: string) { return type === 'text/plain' }

export default function DocumentViewer({ doc, onClose }: DocumentViewerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/documents/${doc.id}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      if (isPDF(doc.file_type) || isImage(doc.file_type)) {
        setUrl(data.url)
        setLoading(false)
        return
      }

      if (isDOCX(doc.file_type)) {
        const fileRes = await fetch(data.url)
        const blob = await fileRes.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const mammoth = (await import('mammoth')).default
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtml(result.value)
        setLoading(false)
        return
      }

      if (isText(doc.file_type)) {
        const fileRes = await fetch(data.url)
        const t = await fileRes.text()
        setText(t)
        setLoading(false)
        return
      }

      setUrl(data.url)
      setLoading(false)
    }
    load()
  }, [doc])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--pm-card)', border: '1px solid var(--pm-border)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--pm-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--pm-text)' }}>{doc.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pm-text-3)' }}>
              {(doc.file_size / 1024 / 1024).toFixed(2)} MB · {doc.file_type.split('/').pop()?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                download={doc.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--pm-bg)', border: '1px solid var(--pm-border)', color: 'var(--pm-text-2)' }}
              >
                <Download className="h-3 w-3" /> Download
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: 'var(--pm-bg)', color: 'var(--pm-text-3)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--pm-accent)' }} />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm" style={{ color: 'var(--pm-error)' }}>{error}</p>
            </div>
          )}
          {!loading && !error && isPDF(doc.file_type) && url && (
            <iframe src={url} className="w-full" style={{ height: '75vh', border: 'none' }} title={doc.name} />
          )}
          {!loading && !error && isImage(doc.file_type) && url && (
            <div className="flex items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={doc.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          )}
          {!loading && !error && html !== null && (
            <div
              className="px-10 py-8 prose prose-sm max-w-none"
              style={{ color: 'var(--pm-text)', fontFamily: 'var(--font-sans)' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
          {!loading && !error && text !== null && (
            <pre className="px-8 py-6 text-sm whitespace-pre-wrap" style={{ color: 'var(--pm-text-2)', fontFamily: 'var(--font-mono)' }}>
              {text}
            </pre>
          )}
          {!loading && !error && !isPDF(doc.file_type) && !isImage(doc.file_type) && html === null && text === null && url && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm" style={{ color: 'var(--pm-text-2)' }}>Preview not available for this file type.</p>
              <a
                href={url}
                download={doc.name}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--pm-accent)', color: '#fff' }}
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
