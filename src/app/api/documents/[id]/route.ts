import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: doc } = await admin.from('documents').select('file_path').eq('id', id).single()

  if (doc) {
    await admin.storage.from('project-documents').remove([doc.file_path])
  }

  const { error } = await admin.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: doc } = await admin.from('documents').select('file_path, name').eq('id', id).single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signedUrl } = await admin.storage
    .from('project-documents')
    .createSignedUrl(doc.file_path, 3600)

  return NextResponse.json({ url: signedUrl?.signedUrl, name: doc.name })
}
