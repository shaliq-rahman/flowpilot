import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error: fetchErr } = await admin
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null
  if (!file || !projectId) return NextResponse.json({ error: 'file and project_id required' }, { status: 400 })

  if (file.size > 52428800) return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 })

  const filePath = `${projectId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const admin = createAdminClient()

  const { error: uploadErr } = await admin.storage
    .from('project-documents')
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: doc, error: dbErr } = await admin.from('documents').insert({
    project_id: projectId,
    uploaded_by: user!.id,
    name: file.name,
    file_path: filePath,
    file_type: file.type,
    file_size: file.size,
  }).select().single()

  if (dbErr) {
    await admin.storage.from('project-documents').remove([filePath])
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json(doc, { status: 201 })
}
