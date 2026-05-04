import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { name, client, platform, budget, start_date, status, notes } = body

  if (!name || !client || !platform || budget == null) {
    return NextResponse.json({ error: 'name, client, platform, budget required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, client, platform, budget, start_date, status: status || 'Active', notes })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
