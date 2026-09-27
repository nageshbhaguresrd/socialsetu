import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c: any[]) {
          c.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data, error } = await supabase
    .from('wa_templates')
    .select('*')
    .order('name')

  if (error) {
    console.warn('wa_templates table query error (fallback applied):', error.message);
    const fallbackTemplates = [
      {
        id: 'default-1',
        name: 'Initial Follow-up',
        body: 'Hi {name}! 👋 I saw your interest in digital marketing for {business}. We help brands in {city} grow with Meta & Google Ads. Can we schedule a quick call? 🚀',
        variables: ['name', 'business', 'city'],
      },
      {
        id: 'default-2',
        name: 'Audit Offer',
        body: "Hi {name}, we would love to do a FREE audit of {business}'s current digital presence. No cost, no commitment. Interested?",
        variables: ['name', 'business'],
      },
      {
        id: 'default-3',
        name: 'Proposal Follow-up',
        body: 'Hi {name}, following up on the proposal we shared for {business}. Any questions I can answer? Happy to jump on a quick call!',
        variables: ['name', 'business'],
      },
    ];
    return NextResponse.json(fallbackTemplates);
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c: any[]) {
          c.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { name, body } = await request.json()

  if (!name || !body) {
    return NextResponse.json({ error: 'name and body required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('wa_templates')
    .insert({ name, body })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}