import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateInvoice } from '@/lib/invoice/generate';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, invoiceNumber } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('name, business, city')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const invoiceNum = invoiceNumber || `SS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const invoiceData = {
      invoiceNumber: invoiceNum,
      date: new Date().toLocaleDateString('en-IN'),
      clientName: lead.name,
      clientBusiness: lead.business,
      clientCity: lead.city,
      items: items as { description: string; amount: number }[],
      gstNumber: '27AAKCS1234Q1Z5',
      agencyName: 'SocialSetu Digital' as const,
      agencyPhone: '+91 9876543210' as const,
      agencyEmail: 'hello@socialsetu.com' as const,
    };

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateInvoice(invoiceData);
    } catch (err) {
      console.error('PDF generation failed:', err);
      return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
    }

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${lead.name.replace(/[^a-z0-9]/gi, '-')}-${invoiceNum}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
