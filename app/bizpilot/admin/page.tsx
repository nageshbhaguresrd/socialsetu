'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Sparkles,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';

export default function PlatformAdminPage() {
  const { lang } = useBizPilot();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const metrics = data?.metrics || {
    totalBusinesses: 0,
    totalMembers: 0,
    paidSubscribers: 0,
    freeSubscribers: 0,
    mrrINR: 0,
    totalAIGenerations: 0,
    totalAICostINR: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-[#7C3AED]" /> {t(lang, 'common.admin')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Global multi-tenant platform metrics, MRR, subscriber health, and AI compute telemetry.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Monthly Recurring Revenue (MRR)
          </span>
          <p className="text-3xl font-black text-[#16A34A] font-mono">
            ₹{metrics.mrrINR.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            From {metrics.paidSubscribers} paid subscriber(s)
          </p>
        </div>

        {/* Total Businesses */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Business Workspaces
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            {metrics.totalBusinesses}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Free tier: {metrics.freeSubscribers} • Paid: {metrics.paidSubscribers}
          </p>
        </div>

        {/* AI Generations */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total AI Generations
          </span>
          <p className="text-3xl font-black text-[#7C3AED] font-mono">
            {metrics.totalAIGenerations.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Across Marketing Studio & Copilot
          </p>
        </div>

        {/* AI Cost */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Estimated AI Cost (INR)
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            ₹{metrics.totalAICostINR}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Low inference overhead
          </p>
        </div>
      </div>

      {/* Recent Workspaces Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          Recently Registered Business Workspaces
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3.5">Business Name</th>
                <th className="p-3.5">Industry</th>
                <th className="p-3.5">Language</th>
                <th className="p-3.5">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(data?.recentBusinesses || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No businesses registered yet.
                  </td>
                </tr>
              ) : (
                (data?.recentBusinesses || []).map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900">{b.name}</td>
                    <td className="p-3.5 text-slate-600">{b.industry || 'General'}</td>
                    <td className="p-3.5 uppercase font-mono">{b.preferred_language}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
