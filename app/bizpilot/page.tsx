'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];

export default function BizPilotDashboardPage() {
  const { activeBusiness, lang, quota } = useBizPilot();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDesc, setSaleDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('Rent');
  const [expenseDesc, setExpenseDesc] = useState('');

  const loadSummary = async (bizId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/summary?business_id=${bizId}&range=month`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      loadSummary(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !saleAmount) return;

    try {
      await fetch('/api/analytics/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          amount: parseFloat(saleAmount),
          description: saleDesc || 'Direct Sale',
          entry_date: new Date().toISOString().split('T')[0],
        }),
      });
      setShowSaleModal(false);
      setSaleAmount('');
      setSaleDesc('');
      loadSummary(activeBusiness.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !expenseAmount) return;

    try {
      await fetch('/api/analytics/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          amount: parseFloat(expenseAmount),
          category: expenseCat,
          description: expenseDesc || 'Expense',
          entry_date: new Date().toISOString().split('T')[0],
        }),
      });
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseDesc('');
      loadSummary(activeBusiness.id);
    } catch (e) {
      console.error(e);
    }
  };

  const summary = data?.summary || {
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: '0',
    totalLeads: 0,
    wonLeads: 0,
    conversionRate: '0',
    followUpsToday: 0,
    overdueFollowUps: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t(lang, 'dashboard.overview')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(lang, 'dashboard.welcome')}, <span className="font-semibold text-slate-800">{activeBusiness?.name || 'Business'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaleModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> {t(lang, 'dashboard.recordSale')}
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> {t(lang, 'dashboard.recordExpense')}
          </button>
          <Link
            href="/bizpilot/marketing"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={14} /> {t(lang, 'dashboard.generateCopy')}
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t(lang, 'dashboard.totalSales')}
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-[#16A34A]">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{summary.totalSales.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            This Month
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t(lang, 'dashboard.totalExpenses')}
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{summary.totalExpenses.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Operating outflows
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t(lang, 'dashboard.netProfit')}
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className={`text-2xl font-black mt-2 font-mono ${summary.netProfit >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
            ₹{summary.netProfit.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            Margin: {summary.profitMargin}%
          </p>
        </div>

        {/* Conversion & Leads */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t(lang, 'dashboard.conversionRate')}
            </span>
            <span className="p-2 rounded-xl bg-purple-50 text-[#7C3AED]">
              <Users size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {summary.conversionRate}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.wonLeads} won of {summary.totalLeads} leads
          </p>
        </div>
      </div>

      {/* Follow-ups Alert Banner */}
      {(summary.followUpsToday > 0 || summary.overdueFollowUps > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-amber-600 flex-shrink-0" />
            <span>
              <b>CRM Attention:</b> You have <b>{summary.followUpsToday}</b> follow-up(s) due today and{' '}
              <b className="text-rose-600">{summary.overdueFollowUps}</b> overdue inquiry(ies).
            </span>
          </div>
          <Link
            href="/bizpilot/leads"
            className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 whitespace-nowrap ml-2"
          >
            Review Leads &rarr;
          </Link>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales vs Expenses Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {t(lang, 'dashboard.monthlyPerformance')}
            </h3>
            <span className="text-xs font-semibold text-slate-400">INR (₹)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="sales" name="Sales" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {t(lang, 'dashboard.leadPipelineStatus')}
          </h3>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.leadStatusDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                >
                  {(data?.leadStatusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [val, 'Leads']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {(data?.leadStatusDistribution || []).map((item: any, i: number) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600">{item.name}: <b>{item.count}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Record Sale */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-[#16A34A]" /> {t(lang, 'dashboard.recordSale')}
              </h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Sale Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Description / Customer
                </label>
                <input
                  value={saleDesc}
                  onChange={(e) => setSaleDesc(e.target.value)}
                  placeholder="e.g. Bulk order delivery to Ramesh Traders"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold shadow-md shadow-green-600/20"
                >
                  Save Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-rose-600" /> {t(lang, 'dashboard.recordExpense')}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Expense Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Category
                </label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                >
                  <option value="Rent">Shop/Office Rent</option>
                  <option value="Raw Material">Inventory / Raw Materials</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Utilities">Electricity & Internet</option>
                  <option value="Logistics">Transport & Delivery</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Notes
                </label>
                <input
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Monthly internet broadband bill"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
