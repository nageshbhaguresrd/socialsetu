import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('audits')
      .select('id, status, scores')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    return NextResponse.json({ id: data.id, status: data.status, scores: data.scores })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}