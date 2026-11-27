'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  Download,
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
  BarChart,
  Bar,
} from 'recharts';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';

export default function AnalyticsPage() {
  const { activeBusiness, lang } = useBizPilot();

  const [range, setRange] = useState<'today' | 'week' | 'month' | 'last_month' | 'all'>('month');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Rent');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async (bizId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/summary?business_id=${bizId}&range=${range}`);
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
      loadData(activeBusiness.id);
    }
  }, [activeBusiness?.id, range]);

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !amount) return;

    try {
      await fetch('/api/analytics/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          amount: parseFloat(amount),
          description: description || 'Sale',
          entry_date: entryDate,
        }),
      });
      setShowSaleModal(false);
      setAmount('');
      setDescription('');
      loadData(activeBusiness.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !amount) return;

    try {
      await fetch('/api/analytics/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          amount: parseFloat(amount),
          category,
          description: description || 'Expense',
          entry_date: entryDate,
        }),
      });
      setShowExpenseModal(false);
      setAmount('');
      setDescription('');
      loadData(activeBusiness.id);
    } catch (e) {
      console.error(e);
    }
  };

  const summary = data?.summary || {
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: '0',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-[#2563EB]" /> {t(lang, 'analytics.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(lang, 'analytics.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center text-xs font-semibold">
            {[
              { id: 'today', label: t(lang, 'analytics.filterToday') },
              { id: 'week', label: t(lang, 'analytics.filterWeek') },
              { id: 'month', label: t(lang, 'analytics.filterMonth') },
              { id: 'last_month', label: t(lang, 'analytics.filterLastMonth') },
              { id: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRange(f.id as any)}
                className={`px-3 py-1 rounded-lg transition-all ${range === f.id ? 'bg-[#2563EB] text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSaleModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Record Sale
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Record Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Revenue (Sales)
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            ₹{summary.totalSales.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <ArrowUpRight size={14} /> Verified Inflows
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Operational Expenses
          </span>
          <p className="text-3xl font-black text-rose-600 font-mono">
            ₹{summary.totalExpenses.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <ArrowDownRight size={14} /> Rent, Stock, Logistics, Utilities
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Net Profit & Margin
          </span>
          <p className={`text-3xl font-black font-mono ${summary.netProfit >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
            ₹{summary.netProfit.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-600 font-semibold mt-2">
            Margin: <b>{summary.profitMargin}%</b>
          </p>
        </div>
      </div>

      {/* Financial Bar Chart */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          Monthly Revenue vs Outflows Breakdown (INR ₹)
        </h3>
        <div className="h-72 w-full">
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

      {/* Recent Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Recent Sales</span>
            <span className="text-xs font-semibold text-emerald-600">Credit</span>
          </h3>

          <div className="space-y-2">
            {(data?.recentSales || []).length === 0 ? (
              <p className="text-xs text-slate-400">No sales recorded in this period.</p>
            ) : (
              (data?.recentSales || []).map((s: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{s.description || 'Sale'}</span>
                    <span className="text-[10px] text-slate-400">{s.entry_date}</span>
                  </div>
                  <span className="font-mono font-bold text-[#16A34A] text-sm">
                    +₹{Number(s.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Recent Expenses</span>
            <span className="text-xs font-semibold text-rose-600">Debit</span>
          </h3>

          <div className="space-y-2">
            {(data?.recentExpenses || []).length === 0 ? (
              <p className="text-xs text-slate-400">No expenses recorded in this period.</p>
            ) : (
              (data?.recentExpenses || []).map((e: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{e.description || e.category}</span>
                    <span className="text-[10px] text-slate-400">{e.entry_date} • {e.category}</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    -₹{Number(e.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Record Sale */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-[#16A34A]" /> Record Sale
              </h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Description / Bill #</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Invoice #204 - Client Delivery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
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
                <Plus size={16} className="text-rose-600" /> Record Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                >
                  <option value="Rent">Shop/Office Rent</option>
                  <option value="Raw Material">Inventory / Stock</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Utilities">Electricity & Broadband</option>
                  <option value="Logistics">Transport & Delivery</option>
                  <option value="Marketing">Marketing & Ads</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Notes</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Courier charges for dispatch"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
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
