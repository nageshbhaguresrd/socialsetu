import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendLeadNotification } from '@/lib/email/resend';
import { contactSubmissionSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const result = contactSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const {
      name,
      city,
      industry,
      budget,
      message,
      phone,
      email,
      source,
    } = body;

    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        city,
        industry,
        budget,
        message,
        phone,
        email,
        source
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
    }

    sendLeadNotification(body).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
