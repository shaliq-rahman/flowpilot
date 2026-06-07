import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { taskSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('project_id')
  const admin = createAdminClient()
  let query = admin.from('tasks').select('*, assignee:assignee_id(id, full_name, email)')

  if (projectId) query = query.eq('project_id', projectId)
  query = query.order('sort_order').order('created_at')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = taskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('tasks').insert(parsed.data)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: created } = await admin
    .from('tasks')
    .select('*, assignee:assignee_id(id, full_name, email)')
    .eq('project_id', parsed.data.project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(created, { status: 201 })
}
