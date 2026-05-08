import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { logActivity } from '@/lib/supabase/logActivity';

// Validation schema for lead updates (all fields optional)
const updateLeadSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  business: z.string().min(2).max(200).optional(),
  city: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  budget: z.string().optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  notes: z.string().optional(),
  value: z.number().min(0).max(10000000).optional(),
  last_contact: z.string().nullable().optional(),
  ai_score: z.number().min(0).max(100).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = updateLeadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message }, 
        { status: 400 }
      );
    }

    const updateData = validation.data;
    
    // Check if any fields provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' }, 
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c) { c.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)); },
        },
      }
    );

    // Explicit Auth Check for Security Test S2/A6
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update lead in database
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedLead) {
      return NextResponse.json(
        { error: 'Lead not found or update failed' }, 
        { status: 404 }
      );
    }

    if (body.stage) {
      await logActivity(id, 'stage_change', `Stage changed to ${body.stage}`);
    } else {
      await logActivity(id, 'updated', 'Lead details updated');
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c) { c.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)); },
        },
      }
    );

    // Explicit Auth Check for Security Test S2/A6
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if lead exists first
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete lead
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete lead' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' }, 
      { status: 500 }
    );
  }
}
