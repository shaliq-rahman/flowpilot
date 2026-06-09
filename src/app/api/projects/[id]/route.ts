import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'
import { projectSchema } from '@/lib/validations'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAuth()
  if (error) return error

  const admin = createAdminClient()
  const { data, error: fetchErr } = await admin
    .from('projects')
    .select('*, tasks(*), milestones(*)')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = projectSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { error: updateErr } = await admin.from('projects').update(parsed.data).eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { data: updated } = await admin
    .from('projects')
    .select('*, tasks(*), milestones(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { error: deleteErr } = await admin.from('projects').delete().eq('id', id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
