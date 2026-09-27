import { getSupabaseAdmin } from './admin';

export async function logActivity(
  leadId: string,
  type: string,
  description: string
) {
  const supabase = getSupabaseAdmin();

  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    type,
    description,
  });
}
