import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'
import { projectSchema } from '@/lib/validations'

export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error

  const admin = createAdminClient()
  const { data, err } = await admin
    .from('projects')
    .select('*, tasks(count), milestones(count)')
    .order('created_at', { ascending: false }) as any

  if (err) return NextResponse.json({ error: err.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { error: insertErr } = await admin
    .from('projects')
    .insert({ ...parsed.data, owner_id: user!.id })

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  const { data: created } = await admin
    .from('projects')
    .select('*, tasks(count), milestones(count)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(created, { status: 201 })
}
