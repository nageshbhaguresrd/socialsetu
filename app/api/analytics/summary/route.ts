import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const range = searchParams.get('range') || 'month'; // 'today' | 'week' | 'month' | 'last_month' | 'all'

    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    if (range === 'today') {
      startDate = now.toISOString().split('T')[0];
    } else if (range === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (range === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    } else if (range === 'all') {
      startDate = '2020-01-01';
    }

    // 1. Fetch Sales Entries
    const { data: sales } = await admin
      .from('sales_entries')
      .select('amount, entry_date, description')
      .eq('business_id', businessId)
      .gte('entry_date', startDate)
      .order('entry_date', { ascending: true });

    // 2. Fetch Expense Entries
    const { data: expenses } = await admin
      .from('expense_entries')
      .select('amount, category, entry_date, description')
      .eq('business_id', businessId)
      .gte('entry_date', startDate)
      .order('entry_date', { ascending: true });

    // Decimal-safe summing
    const totalSales = (sales || []).reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalExpenses = (expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netProfit = totalSales - totalExpenses;

    // 3. Fetch Leads Stats
    const { data: leads } = await admin
      .from('leads')
      .select('status, source, created_at, next_follow_up_at')
      .eq('business_id', businessId);

    const totalLeads = leads?.length || 0;
    const wonLeads = (leads || []).filter((l) => l.status === 'won').length;
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

    const todayStr = now.toISOString().split('T')[0];
    const followUpsToday = (leads || []).filter((l) => l.next_follow_up_at && l.next_follow_up_at.startsWith(todayStr)).length;
    const overdueFollowUps = (leads || []).filter((l) => l.next_follow_up_at && l.next_follow_up_at.split('T')[0] < todayStr && l.status !== 'won' && l.status !== 'lost').length;

    // Status breakdown
    const leadStatusMap: Record<string, number> = { new: 0, contacted: 0, interested: 0, won: 0, lost: 0 };
    (leads || []).forEach((l) => {
      leadStatusMap[l.status] = (leadStatusMap[l.status] || 0) + 1;
    });

    // Monthly Chart timeseries compilation
    const monthlyMap: Record<string, { month: string; sales: number; expenses: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    (sales || []).forEach((s) => {
      const m = months[new Date(s.entry_date).getMonth()];
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, sales: 0, expenses: 0 };
      monthlyMap[m].sales += Number(s.amount || 0);
    });

    (expenses || []).forEach((e) => {
      const m = months[new Date(e.entry_date).getMonth()];
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, sales: 0, expenses: 0 };
      monthlyMap[m].expenses += Number(e.amount || 0);
    });

    const chartData = Object.values(monthlyMap);

    return NextResponse.json({
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        profitMargin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0',
        totalLeads,
        wonLeads,
        conversionRate,
        followUpsToday,
        overdueFollowUps,
      },
      leadStatusDistribution: [
        { name: 'New', count: leadStatusMap.new },
        { name: 'Contacted', count: leadStatusMap.contacted },
        { name: 'Interested', count: leadStatusMap.interested },
        { name: 'Won', count: leadStatusMap.won },
        { name: 'Lost', count: leadStatusMap.lost },
      ],
      chartData: chartData.length > 0 ? chartData : [
        { month: 'Current', sales: totalSales, expenses: totalExpenses }
      ],
      recentSales: (sales || []).slice(-5).reverse(),
      recentExpenses: (expenses || []).slice(-5).reverse(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Analytics error' }, { status: 500 });
  }
}
