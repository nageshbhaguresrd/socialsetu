'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  Users,
  BarChart3,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Plus,
  Globe,
  Bell,
  Menu,
  X,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { SupportedLanguage, t, LANGUAGE_LABELS } from '@/src/lib/i18n';
import { Business } from '@/src/types/bizpilot';
import { BizPilotContext, useBizPilot, BizPilotQuota } from '@/src/context/BizPilotContext';

export { useBizPilot };


export default function BizPilotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [quota, setQuota] = useState({ used: 0, limit: 20, remaining: 20, percentage: 0, planName: 'Free' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewBizModal, setShowNewBizModal] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizIndustry, setNewBizIndustry] = useState('Retail');

  // Load Workspaces
  const loadWorkspaces = async () => {
    try {
      const res = await fetch('/api/businesses');
      const data = await res.json();
      if (data.businesses && data.businesses.length > 0) {
        setBusinesses(data.businesses);
        if (!activeBusiness) {
          setActiveBusiness(data.businesses[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load workspaces:', e);
    }
  };

  // Load Quota
  const loadQuota = async (bizId: string) => {
    try {
      const res = await fetch(`/api/usage?business_id=${bizId}`);
      const data = await res.json();
      if (data.limit) {
        setQuota(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (activeBusiness?.id) {
      loadQuota(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBizName,
          industry: newBizIndustry,
          preferred_language: lang,
        }),
      });
      const data = await res.json();
      if (data.business) {
        setShowNewBizModal(false);
        setNewBizName('');
        await loadWorkspaces();
        setActiveBusiness(data.business);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { href: '/bizpilot', label: t(lang, 'common.dashboard'), icon: LayoutDashboard },
    { href: '/bizpilot/assistant', label: t(lang, 'common.aiAssistant'), icon: Bot, badge: 'AI' },
    { href: '/bizpilot/marketing', label: t(lang, 'common.marketingStudio'), icon: Sparkles },
    { href: '/bizpilot/leads', label: t(lang, 'common.leadsCRM'), icon: Users },
    { href: '/bizpilot/analytics', label: t(lang, 'common.analytics'), icon: BarChart3 },
    { href: '/bizpilot/billing', label: t(lang, 'common.subscription'), icon: CreditCard },
    { href: '/bizpilot/admin', label: t(lang, 'common.admin'), icon: ShieldCheck },
  ];

  return (
    <BizPilotContext.Provider
      value={{
        activeBusiness,
        businesses,
        setActiveBusiness,
        lang,
        setLang,
        refreshWorkspaces: loadWorkspaces,
        quota,
      }}
    >
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
        {/* Top Header */}
        <header className="h-16 bg-[#111827] text-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-300 hover:text-white"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Brand Logo */}
            <Link href="/bizpilot" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center font-black text-white text-base shadow-md">
                B
              </span>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                BizPilot <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C3AED]/30 text-[#A78BFA] border border-[#7C3AED]/40 ml-1">AI</span>
              </span>
            </Link>

            {/* Workspace Selector */}
            <div className="hidden sm:flex items-center gap-2 bg-[#1F2937] border border-slate-700 rounded-xl px-3 py-1.5 ml-4">
              <Building2 size={14} className="text-[#3B82F6]" />
              <select
                value={activeBusiness?.id || ''}
                onChange={(e) => {
                  const b = businesses.find((x) => x.id === e.target.value);
                  if (b) setActiveBusiness(b);
                }}
                className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
              >
                {businesses.length === 0 ? (
                  <option value="">Demo Workspace</option>
                ) : (
                  businesses.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#1F2937] text-white">
                      {b.name} ({b.industry || 'Business'})
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={() => setShowNewBizModal(true)}
                title="Create New Business"
                className="p-1 hover:text-[#3B82F6] text-slate-400"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Right Header: Language Switcher, Quota, Notifications */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-[#1F2937] border border-slate-700 rounded-xl px-2.5 py-1">
              <Globe size={13} className="text-slate-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
              >
                <option value="en" className="bg-[#1F2937] text-white">English</option>
                <option value="hi" className="bg-[#1F2937] text-white">हिंदी (Hindi)</option>
                <option value="mr" className="bg-[#1F2937] text-white">मराठी (Marathi)</option>
              </select>
            </div>

            {/* AI Quota Meter */}
            <div className="hidden lg:flex items-center gap-2 bg-[#1F2937] border border-slate-700 rounded-xl px-3 py-1 text-xs">
              <Sparkles size={13} className="text-[#A78BFA]" />
              <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] h-full"
                  style={{ width: `${quota.percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-300">
                {quota.used}/{quota.limit} AI
              </span>
            </div>

            <Link
              href="/crm"
              className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all hidden sm:block"
            >
              Sales CRM &rarr;
            </Link>
          </div>
        </header>

        {/* Main Canvas with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`w-64 bg-[#111827] text-slate-300 border-r border-slate-800 p-4 flex flex-col justify-between flex-shrink-0 transition-all ${
              sidebarOpen ? 'block fixed inset-y-16 left-0 z-30' : 'hidden md:flex'
            }`}
          >
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30 font-bold'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#7C3AED]/40 text-[#DDD6FE]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Active Workspace Card */}
            <div className="bg-[#1F2937] border border-slate-700 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t(lang, 'common.workspace')}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                  {quota.planName}
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {activeBusiness?.name || 'My Business'}
              </p>
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[10px] text-slate-400">
                <span>{activeBusiness?.industry || 'Services'}</span>
                <span>INR (₹)</span>
              </div>
            </div>
          </aside>

          {/* Main Work Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>

        {/* Modal: New Business Workspace */}
        {showNewBizModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={16} className="text-[#2563EB]" /> {t(lang, 'common.newWorkspace')}
                </h3>
                <button onClick={() => setShowNewBizModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateBusiness} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Business / Store Name
                  </label>
                  <input
                    required
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="e.g. Pune Spices & Grocery"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Industry / Category
                  </label>
                  <select
                    value={newBizIndustry}
                    onChange={(e) => setNewBizIndustry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="Retail">Retail & Wholesaler</option>
                    <option value="Manufacturing">Manufacturing & Distribution</option>
                    <option value="Services">Professional Services & Consulting</option>
                    <option value="Logistics">Transport & Logistics</option>
                    <option value="Agency">Digital Agency & Marketing</option>
                    <option value="Startup">Startup / Tech</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBizModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {t(lang, 'common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-[#1D4ED8]"
                  >
                    {t(lang, 'common.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BizPilotContext.Provider>
  );
}
