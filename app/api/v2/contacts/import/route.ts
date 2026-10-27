import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { clientId, contacts } = body;

    if (!clientId || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'clientId and non-empty contacts array are required' },
        { status: 400 }
      );
    }

    const formatted = contacts.map((c: any) => ({
      client_id: clientId,
      first_name: c.first_name || c.firstName || c.name || 'Valued',
      last_name: c.last_name || c.lastName || null,
      relationship: c.relationship || 'Customer',
      email: c.email || null,
      phone: c.phone || null,
      birthday: c.birthday || null,
      anniversary: c.anniversary || null,
      tags: Array.isArray(c.tags) ? c.tags : c.tags ? [c.tags] : ['Imported'],
      notes: c.notes || null,
    }));

    const { data, error } = await admin
      .from('client_contacts')
      .insert(formatted)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      importedCount: data?.length || 0,
      contacts: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Bulk import failed' },
      { status: 500 }
    );
  }
}
