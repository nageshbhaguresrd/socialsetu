import { GoogleGenAI } from '@google/genai';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export class BusinessAssistantService {
  /**
   * Aggregate verified financial and lead telemetry from Supabase
   */
  static async getVerifiedTelemetry(businessId: string) {
    const admin = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // 1. Leads counts
    const { data: leads } = await admin
      .from('leads')
      .select('id, name, status, next_follow_up_at, created_at')
      .eq('business_id', businessId);

    const totalLeads = leads?.length || 0;
    const newLeadsThisMonth = (leads || []).filter((l) => l.created_at >= firstDayOfMonth).length;
    const wonLeads = (leads || []).filter((l) => l.status === 'won').length;
    const followUpsToday = (leads || []).filter((l) => l.next_follow_up_at && l.next_follow_up_at.startsWith(today)).length;
    const overdueFollowUps = (leads || []).filter((l) => l.next_follow_up_at && l.next_follow_up_at.split('T')[0] < today && l.status !== 'won' && l.status !== 'lost').length;

    // 2. Verified Sales Sum (NUMERIC)
    const { data: sales } = await admin
      .from('sales_entries')
      .select('amount, entry_date')
      .eq('business_id', businessId)
      .gte('entry_date', firstDayOfMonth);

    const totalSalesMonth = (sales || []).reduce((acc, s) => acc + Number(s.amount || 0), 0);

    // 3. Verified Expenses Sum (NUMERIC)
    const { data: expenses } = await admin
      .from('expense_entries')
      .select('amount, entry_date, category')
      .eq('business_id', businessId)
      .gte('entry_date', firstDayOfMonth);

    const totalExpensesMonth = (expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netProfitMonth = totalSalesMonth - totalExpensesMonth;

    return {
      totalLeads,
      newLeadsThisMonth,
      wonLeads,
      conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0',
      followUpsToday,
      overdueFollowUps,
      totalSalesMonth,
      totalExpensesMonth,
      netProfitMonth,
      currency: 'INR (₹)',
      asOfDate: today,
    };
  }

  /**
   * Conversational query handler
   */
  static async query(params: {
    businessId: string;
    businessName: string;
    question: string;
    language?: 'en' | 'hi' | 'mr';
  }): Promise<{ answer: string; verifiedData: any; modelUsed: string }> {
    const verifiedData = await this.getVerifiedTelemetry(params.businessId);
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
    const lang = params.language || 'en';

    const langInstruction =
      lang === 'mr'
        ? 'Respond in clear, natural Marathi (Devanagari script).'
        : lang === 'hi'
        ? 'Respond in clear, professional Hindi (Devanagari script).'
        : 'Respond in professional, helpful English.';

    const systemInstruction = `You are BizPilot AI, the executive business copilot for ${params.businessName}.
Language Rule: ${langInstruction}

CRITICAL RULES:
1. Always anchor your answer in the VERIFIED TELEMETRY provided below.
2. NEVER invent sales numbers, customer counts, or expenses. If data is zero, state that clearly.
3. Clearly separate verified numerical facts from tactical suggestions or insights.
4. Format output cleanly with markdown bullet points and bold financial figures.

VERIFIED TELEMETRY:
- Total Sales This Month: ₹${verifiedData.totalSalesMonth.toLocaleString('en-IN')}
- Total Expenses This Month: ₹${verifiedData.totalExpensesMonth.toLocaleString('en-IN')}
- Net Profit/Margin This Month: ₹${verifiedData.netProfitMonth.toLocaleString('en-IN')}
- Total Leads: ${verifiedData.totalLeads} (New This Month: ${verifiedData.newLeadsThisMonth})
- Won Deals: ${verifiedData.wonLeads} (Conversion Rate: ${verifiedData.conversionRate}%)
- Follow-ups Due Today: ${verifiedData.followUpsToday}
- Overdue Follow-ups: ${verifiedData.overdueFollowUps}`;

    if (ai) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: params.question,
            config: {
              systemInstruction,
              temperature: 0.3, // Lower temperature to prevent hallucination
            },
          });
          const text = res.text?.trim();
          if (text) {
            return {
              answer: text,
              verifiedData,
              modelUsed: model,
            };
          }
        } catch (err) {
          console.warn(`[BusinessAssistantService] Model ${model} error:`, err);
        }
      }
    }

    // Deterministic fallback response based on verified telemetry
    if (lang === 'mr') {
      return {
        answer: `📊 **${params.businessName} - चालू महिन्याची आकडेवारी:**\n\n` +
          `• **एकूण विक्री:** ₹${verifiedData.totalSalesMonth.toLocaleString('en-IN')}\n` +
          `• **एकूण खर्च:** ₹${verifiedData.totalExpensesMonth.toLocaleString('en-IN')}\n` +
          `• **निव्वळ नफा:** ₹${verifiedData.netProfitMonth.toLocaleString('en-IN')}\n` +
          `• **एकूण लीड्स:** ${verifiedData.totalLeads} (यशस्वी: ${verifiedData.wonLeads}, दर: ${verifiedData.conversionRate}%)\n` +
          `• **आजचे फॉलो-अप्स:** ${verifiedData.followUpsToday} (थकबाकी: ${verifiedData.overdueFollowUps})\n\n` +
          `💡 *टीप:* पाठपुरावा वेळेवर केल्याने लीड्सचे ग्राहकांमध्ये रूपांतर होण्याचे प्रमाण ३०% वाढते.`,
        verifiedData,
        modelUsed: 'deterministic-verified',
      };
    } else if (lang === 'hi') {
      return {
        answer: `📊 **${params.businessName} - इस माह का वित्तीय सारांश:**\n\n` +
          `• **कुल बिक्री:** ₹${verifiedData.totalSalesMonth.toLocaleString('en-IN')}\n` +
          `• **कुल खर्चे:** ₹${verifiedData.totalExpensesMonth.toLocaleString('en-IN')}\n` +
          `• **शुद्ध लाभ:** ₹${verifiedData.netProfitMonth.toLocaleString('en-IN')}\n` +
          `• **कुल लीड्स:** ${verifiedData.totalLeads} (सफल सौदे: ${verifiedData.wonLeads}, दर: ${verifiedData.conversionRate}%)\n` +
          `• **आज के फॉलो-अप्स:** ${verifiedData.followUpsToday} (लंबित: ${verifiedData.overdueFollowUps})\n\n` +
          `💡 *सुझाव:* समय पर फॉलो-अप करने से रूपांतरण दर में काफी सुधार होता है।`,
        verifiedData,
        modelUsed: 'deterministic-verified',
      };
    }

    return {
      answer: `📊 **${params.businessName} — Business Summary:**\n\n` +
        `• **Sales (This Month):** ₹${verifiedData.totalSalesMonth.toLocaleString('en-IN')}\n` +
        `• **Expenses (This Month):** ₹${verifiedData.totalExpensesMonth.toLocaleString('en-IN')}\n` +
        `• **Net Margin:** ₹${verifiedData.netProfitMonth.toLocaleString('en-IN')}\n` +
        `• **Leads Overview:** ${verifiedData.totalLeads} total, ${verifiedData.wonLeads} closed won (${verifiedData.conversionRate}% win rate)\n` +
        `• **Action Items:** ${verifiedData.followUpsToday} follow-up(s) due today, ${verifiedData.overdueFollowUps} overdue\n\n` +
        `💡 *Recommendation:* Prioritize the ${verifiedData.overdueFollowUps} overdue inquiries to accelerate your pipeline velocity.`,
      verifiedData,
      modelUsed: 'deterministic-verified',
    };
  }
}
