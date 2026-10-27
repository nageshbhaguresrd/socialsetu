import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const { data: contacts, error } = await admin
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('first_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts: contacts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();

    const {
      id,
      clientId,
      firstName,
      lastName,
      relationship = 'Customer',
      email,
      phone,
      birthday,
      anniversary,
      tags = [],
      notes,
    } = body;

    if (!clientId || !firstName) {
      return NextResponse.json(
        { error: 'clientId and firstName are required' },
        { status: 400 }
      );
    }

    const payload = {
      client_id: clientId,
      first_name: firstName,
      last_name: lastName || null,
      relationship,
      email: email || null,
      phone: phone || null,
      birthday: birthday || null,
      anniversary: anniversary || null,
      tags,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      result = await admin
        .from('client_contacts')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    } else {
      result = await admin
        .from('client_contacts')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, contact: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save contact' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contact id is required' }, { status: 400 });
    }

    const { error } = await admin.from('client_contacts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Contact deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
