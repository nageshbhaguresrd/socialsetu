'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';

export default function BillingPage() {
  const { activeBusiness, lang, quota, refreshWorkspaces } = useBizPilot();

  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingCode, setUpgradingCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSubscription = async (bizId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/billing/subscription?business_id=${bizId}`);
      const data = await res.json();
      if (data.availablePlans) setPlans(data.availablePlans);
      if (data.subscription) setCurrentSub(data.subscription);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      loadSubscription(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  const handleSelectPlan = async (planCode: string) => {
    if (!activeBusiness?.id) return;

    setUpgradingCode(planCode);
    setMessage(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          plan_code: planCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout initialization failed');
      }

      if (planCode === 'free') {
        setMessage({ text: 'Switched to Free Plan successfully!', type: 'success' });
        loadSubscription(activeBusiness.id);
        refreshWorkspaces();
      } else {
        // Trigger simulated or Razorpay checkout
        setMessage({
          text: `Checkout initialized for ₹${data.amountINR} (${data.plan.name} Plan). Razorpay Order: ${data.orderId}`,
          type: 'success',
        });
        // In dev or sandbox environment, immediately update via simulated webhook
        await fetch('/api/billing/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'payment.captured',
            notes: {
              business_id: activeBusiness.id,
              plan_code: planCode,
            },
          }),
        });
        loadSubscription(activeBusiness.id);
        refreshWorkspaces();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Upgrade failed', type: 'error' });
    } finally {
      setUpgradingCode(null);
    }
  };

  const defaultPlans = [
    {
      code: 'free',
      name: 'Free',
      monthly_price_inr: 0,
      ai_generations_limit: 20,
      lead_limit: 25,
      member_limit: 1,
      features: ['20 AI generations / month', '25 Leads capacity', '1 Team member', 'Basic sales & expense tracking'],
    },
    {
      code: 'starter',
      name: 'Starter',
      monthly_price_inr: 499,
      ai_generations_limit: 150,
      lead_limit: 500,
      member_limit: 1,
      features: ['150 AI generations / month', '500 Leads capacity', 'AI Marketing Assistant', 'Follow-up reminders', 'Basic reports'],
    },
    {
      code: 'professional',
      name: 'Professional',
      monthly_price_inr: 1499,
      ai_generations_limit: 600,
      lead_limit: 10000,
      member_limit: 3,
      popular: true,
      features: ['600 AI generations / month', 'Unlimited Leads (fair use)', '3 Team members', 'AI Business Assistant (chat)', 'Advanced analytics', 'CSV exports'],
    },
    {
      code: 'business',
      name: 'Business',
      monthly_price_inr: 4999,
      ai_generations_limit: 2500,
      lead_limit: 50000,
      member_limit: 10,
      features: ['2,500 AI generations / month', '50,000 Leads capacity', '10 Team members', 'Multiple workspaces', 'Priority support', 'Dedicated reports'],
    },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="text-[#2563EB]" /> {t(lang, 'billing.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t(lang, 'billing.subtitle')}
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Quota & Current Plan Overview */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t(lang, 'billing.currentPlan')}
          </span>
          <h3 className="text-xl font-black text-slate-900">
            {currentSub?.plan?.name || quota.planName} Plan
          </h3>
          <p className="text-xs text-slate-500">
            Workspace: <b>{activeBusiness?.name}</b> • Active billing cycle
          </p>
        </div>

        <div className="w-full md:w-80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">AI Quota Consumed</span>
            <span className="font-mono text-slate-500">
              {quota.used} / {quota.limit} ({quota.remaining} remaining)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] h-full"
              style={{ width: `${quota.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayPlans.map((p) => {
          const isCurrent = (currentSub?.plan?.code || 'free') === p.code;
          const isPopular = p.code === 'professional' || p.popular;

          return (
            <div
              key={p.code}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all bg-white border ${
                isCurrent
                  ? 'border-[#2563EB] shadow-md ring-2 ring-blue-500/20'
                  : isPopular
                  ? 'border-purple-300 shadow-md ring-1 ring-purple-300'
                  : 'border-slate-200/80 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                  {isCurrent ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                      Current
                    </span>
                  ) : isPopular ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200">
                      Popular
                    </span>
                  ) : null}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    ₹{p.monthly_price_inr?.toLocaleString('en-IN') || (p.monthly_price_paise ? p.monthly_price_paise / 100 : 0)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold"> /month</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#16A34A] flex-shrink-0" />
                    <span><b>{p.ai_generations_limit}</b> AI Generations / mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#16A34A] flex-shrink-0" />
                    <span><b>{p.lead_limit?.toLocaleString('en-IN')}</b> Leads capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#16A34A] flex-shrink-0" />
                    <span><b>{p.member_limit}</b> Team Member(s)</span>
                  </div>
                  {Array.isArray(p.features) && p.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={14} className="text-[#16A34A] flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-default"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(p.code)}
                    disabled={upgradingCode === p.code}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white hover:opacity-95'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {upgradingCode === p.code ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Zap size={14} />
                    )}
                    {p.code === 'free' ? 'Switch to Free' : 'Upgrade Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
