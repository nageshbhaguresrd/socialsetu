import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { salesEntrySchema } from '@/src/lib/validation/bizpilotSchemas';

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();

    const validation = salesEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { data: sale, error } = await admin
      .from('sales_entries')
      .insert({
        business_id: validation.data.business_id,
        amount: validation.data.amount,
        description: validation.data.description,
        entry_date: validation.data.entry_date,
        currency_code: 'INR',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sale });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record sale' }, { status: 500 });
  }
}
