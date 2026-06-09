import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth()
  if (error) return error

  const admin = createAdminClient()
  const { data: doc } = await admin.from('documents').select('file_path, name').eq('id', id).single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signedUrl } = await admin.storage
    .from('project-documents')
    .createSignedUrl(doc.file_path, 3600)

  return NextResponse.json({ url: signedUrl?.signedUrl, name: doc.name })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { data: doc } = await admin.from('documents').select('file_path').eq('id', id).single()
  if (doc) await admin.storage.from('project-documents').remove([doc.file_path])

  const { error: deleteErr } = await admin.from('documents').delete().eq('id', id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
