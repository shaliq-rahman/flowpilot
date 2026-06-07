import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null

  if (!file || !projectId) return NextResponse.json({ error: 'file and project_id required' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filePath = `${projectId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('project-documents')
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: doc, error: dbError } = await admin
    .from('documents')
    .insert({
      project_id: projectId,
      uploaded_by: user.id,
      name: file.name,
      file_path: filePath,
      file_type: file.type || `application/${ext}`,
      file_size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    await admin.storage.from('project-documents').remove([filePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(doc, { status: 201 })
}
