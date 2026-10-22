import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use admin client to bypass RLS since campaigns policies require auth session
    const adminClient = getSupabaseAdmin()
    const { data, error } = await adminClient
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, client, platform, budget, start_date, status, notes, client_id } = body

    if (!name || !client || !platform || budget == null) {
      return NextResponse.json({ error: 'name, client, platform, budget required' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    const { data, error } = await adminClient
      .from('campaigns')
      .insert({ name, client, client_id: client_id || null, platform, budget, start_date, status: status || 'Active', notes })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
