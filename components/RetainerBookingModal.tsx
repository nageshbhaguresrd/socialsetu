'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  PhoneCall, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  QrCode,
  DollarSign,
  Rocket
} from 'lucide-react';

interface RetainerBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: string;
  initialPrice?: number;
  period?: 'monthly' | 'quarterly';
  initialBusiness?: string;
  initialName?: string;
  initialPhone?: string;
}

export default function RetainerBookingModal({
  isOpen,
  onClose,
  initialPlan = 'Growth',
  initialPrice = 30000,
  period = 'monthly',
  initialBusiness = '',
  initialName = '',
  initialPhone = '',
}: RetainerBookingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);
  const [name, setName] = useState(initialName);
  const [business, setBusiness] = useState(initialBusiness);
  const [city, setCity] = useState('Pune');
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showUpiDetails, setShowUpiDetails] = useState(false);

  if (!isOpen) return null;

  const planPrices: Record<string, { monthly: number; quarterly: number }> = {
    Starter: { monthly: 10000, quarterly: 25500 },
    Growth: { monthly: 30000, quarterly: 76500 },
    Premium: { monthly: 75000, quarterly: 191250 },
  };

  const currentPrice = planPrices[selectedPlan]?.[period] ?? initialPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        business,
        city,
        phone,
        email,
        industry: `${business} (Interested in ${selectedPlan} ${period} plan)`,
        budget: `Rs ${currentPrice.toLocaleString('en-IN')} / ${period}`,
        message: `Direct package booking request for ${selectedPlan} retainer (₹${currentPrice.toLocaleString('en-IN')})`,
        source: 'package_booking',
      };

      await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Booking submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi SocialSetu team! I am interested in onboarding with the *${selectedPlan} Package* (₹${currentPrice.toLocaleString('en-IN')}/${period}). My brand is "${business || name}" in ${city}. How soon can we start?`
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-[#0B0B18] border border-[#1E1E35] rounded-3xl max-w-xl w-full p-6 md:p-8 relative shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B35]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-20"
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <div className="space-y-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[11px] font-bold mb-3">
                <Sparkles size={13} /> Fast-Track Client Onboarding
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                Book Your <span className="text-[#FF6B35]">{selectedPlan}</span> Retainer
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                Reserve your agency slot. Our senior growth strategist will reach out within 2 hours.
              </p>
            </div>

            {/* Plan Selector Pills */}
            <div className="grid grid-cols-3 gap-2">
              {['Starter', 'Growth', 'Premium'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlan(p)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    selectedPlan === p
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-lg shadow-[#FF6B35]/25'
                      : 'bg-[#16162A] border-[#252542] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div>{p}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    ₹{(planPrices[p]?.[period] / 1000).toFixed(0)}k/{period === 'monthly' ? 'mo' : '3mo'}
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#16162A] border border-[#252542] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Brand / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={business}
                    onChange={e => setBusiness(e.target.value)}
                    placeholder="e.g. Pune Fitness Studio"
                    className="w-full bg-[#16162A] border border-[#252542] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#16162A] border border-[#252542] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Delhi"
                    className="w-full bg-[#16162A] border border-[#252542] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                  className="w-full bg-[#16162A] border border-[#252542] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/25 transition-all"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                  {loading ? 'Submitting Details...' : `Confirm & Request ${selectedPlan} Onboarding`}
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 pt-1">
                <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#10B981]" /> Month-to-Month</span>
                <span className="flex items-center gap-1"><Check size={12} className="text-[#10B981]" /> 100% Tax Invoiced</span>
                <span className="flex items-center gap-1"><Check size={12} className="text-[#10B981]" /> Dedicated Manager</span>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Screen with Instant WhatsApp Trigger & UPI Option */
          <div className="text-center space-y-6 py-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto text-[#10B981]">
              <Check size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">We Received Your Request!</h3>
              <p className="text-gray-400 text-xs max-w-md mx-auto">
                Thank you <strong className="text-white">{name}</strong>. Your onboarding request for <strong className="text-[#FF6B35]">{selectedPlan} Package</strong> ({business}) has been registered in our CRM.
              </p>
            </div>

            <div className="p-4 bg-[#121226] border border-[#252542] rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Selected Package:</span>
                <span className="text-white font-bold">{selectedPlan} ({period})</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Monthly Retainer:</span>
                <span className="text-[#10B981] font-mono font-bold">₹{currentPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Dedicated POC:</span>
                <span className="text-white font-bold">Nagesh Bhagure & Lead Strategist</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_AGENCY_PHONE || '917276119511'}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold px-6 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                <PhoneCall size={14} /> Open WhatsApp Chat Now <ArrowRight size={14} />
              </a>
              <button
                onClick={() => setShowUpiDetails(!showUpiDetails)}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <QrCode size={14} /> {showUpiDetails ? 'Hide Payment Details' : 'View UPI / Payment Info'}
              </button>
            </div>

            {/* Collapsible UPI / Bank Details for Onboarding Deposit */}
            {showUpiDetails && (
              <div className="bg-[#051108] border border-[#10B981]/30 rounded-2xl p-5 text-left text-xs space-y-2 mt-4 max-w-md mx-auto">
                <div className="text-[#10B981] font-bold uppercase tracking-wider text-[10px]">
                  Official Agency Payment Details
                </div>
                <div className="text-gray-300">
                  <strong>Agency:</strong> SocialSetu Digital Media
                </div>
                <div className="text-gray-300">
                  <strong>UPI ID:</strong> <code className="bg-white/10 px-2 py-0.5 rounded text-white">7276119511@ybl</code> (or GPay / PhonePe to 7276119511)
                </div>
                <div className="text-gray-400 text-[11px] pt-1">
                  * You can pay a refundable token advance of ₹4,999 to immediately lock in your onboarding slot and media production calendar.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
