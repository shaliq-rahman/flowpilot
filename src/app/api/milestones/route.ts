import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'
import { milestoneSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const projectId = req.nextUrl.searchParams.get('project_id')
  const admin = createAdminClient()
  let query = admin.from('milestones').select('*')
  if (projectId) query = query.eq('project_id', projectId)
  query = query.order('due_date')

  const { data, error: fetchErr } = await query
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = milestoneSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { error: insertErr } = await admin.from('milestones').insert(parsed.data)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  const { data: created } = await admin
    .from('milestones')
    .select('*')
    .eq('project_id', parsed.data.project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(created, { status: 201 })
}
