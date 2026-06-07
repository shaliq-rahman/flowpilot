import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.rpc('recalculate_project_completion', { p_project_id: id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = await supabase.from('projects').select('completion_pct').eq('id', id).single()
  return NextResponse.json(data)
}
