'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  DollarSign,
  Briefcase,
  Layers,
  PhoneCall
} from 'lucide-react';

interface IndustryBenchmark {
  id: string;
  name: string;
  cplRange: [number, number]; // Cost Per Lead in INR
  conversionRate: number; // In percentage (e.g. 18 = 18%)
  avgCustomerValue: number; // Average ticket size in INR
  typicalRoas: string;
  recommendedPackage: string;
}

const INDUSTRY_DATA: IndustryBenchmark[] = [
  {
    id: 'fitness',
    name: 'Fitness & Gyms',
    cplRange: [120, 220],
    conversionRate: 18,
    avgCustomerValue: 18000, // Annual membership
    typicalRoas: '4.2X - 5.5X',
    recommendedPackage: 'Growth (₹30,000/mo)',
  },
  {
    id: 'food',
    name: 'Restaurants & Cafes',
    cplRange: [60, 110],
    conversionRate: 25,
    avgCustomerValue: 2400, // Average group table bill
    typicalRoas: '3.8X - 4.8X',
    recommendedPackage: 'Starter (₹10,000/mo)',
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Builders',
    cplRange: [280, 550],
    conversionRate: 4,
    avgCustomerValue: 250000, // Commission / token booking
    typicalRoas: '8.0X - 12.0X',
    recommendedPackage: 'Premium (₹75,000/mo)',
  },
  {
    id: 'healthcare',
    name: 'Clinics & Healthcare',
    cplRange: [160, 310],
    conversionRate: 22,
    avgCustomerValue: 12000, // Procedure / treatment plan
    typicalRoas: '4.5X - 6.0X',
    recommendedPackage: 'Growth (₹30,000/mo)',
  },
  {
    id: 'd2c',
    name: 'D2C & E-Commerce',
    cplRange: [140, 280],
    conversionRate: 15,
    avgCustomerValue: 2800, // Average order value
    typicalRoas: '3.5X - 4.5X',
    recommendedPackage: 'Growth (₹30,000/mo)',
  },
  {
    id: 'salon',
    name: 'Salons & Spas',
    cplRange: [80, 150],
    conversionRate: 28,
    avgCustomerValue: 3500, // Package / service bill
    typicalRoas: '4.0X - 5.2X',
    recommendedPackage: 'Starter (₹10,000/mo)',
  },
];

interface ROICalculatorProps {
  onSelectPlan?: (planName: string) => void;
}

export default function ROICalculator({ onSelectPlan }: ROICalculatorProps = {}) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('fitness');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(30000);

  const activeIndustry = useMemo(() => {
    return INDUSTRY_DATA.find(i => i.id === selectedIndustry) || INDUSTRY_DATA[0];
  }, [selectedIndustry]);

  const calculations = useMemo(() => {
    const avgCpl = (activeIndustry.cplRange[0] + activeIndustry.cplRange[1]) / 2;
    const estLeadsMin = Math.round(monthlyBudget / activeIndustry.cplRange[1]);
    const estLeadsMax = Math.round(monthlyBudget / activeIndustry.cplRange[0]);
    const estLeadsAvg = Math.round((estLeadsMin + estLeadsMax) / 2);

    const estReach = Math.round(monthlyBudget * 3.8); // Avg ~3.8 impressions/reach per rupee in Indian regional Meta ads
    const estCustomersMin = Math.max(1, Math.round(estLeadsMin * (activeIndustry.conversionRate / 100)));
    const estCustomersMax = Math.max(2, Math.round(estLeadsMax * (activeIndustry.conversionRate / 100)));

    const estRevenueMin = estCustomersMin * activeIndustry.avgCustomerValue;
    const estRevenueMax = estCustomersMax * activeIndustry.avgCustomerValue;

    return {
      estReach,
      estLeadsMin,
      estLeadsMax,
      estLeadsAvg,
      estCustomersMin,
      estCustomersMax,
      estRevenueMin,
      estRevenueMax,
    };
  }, [activeIndustry, monthlyBudget]);

  const whatsappMessage = encodeURIComponent(
    `Hi SocialSetu team! I used your ROI Calculator for my ${activeIndustry.name} business with a monthly marketing budget of ₹${monthlyBudget.toLocaleString('en-IN')}. It projected ~${calculations.estLeadsMin}-${calculations.estLeadsMax} qualified leads. Can we discuss custom execution for this?`
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0F0F1A] via-[#121226] to-[#0A0A16] border border-[#1E1E35] p-8 md:p-12 shadow-2xl">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] text-xs font-bold">
            <Calculator size={14} /> Interactive Growth Forecast
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            How Many Leads Will <span className="text-[#FF6B35]">Your Budget</span> Deliver?
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Real performance benchmarks calibrated for Indian regional markets (Pune, Mumbai, Tier-1 & Tier-2 cities).
          </p>
        </div>

        {/* Step 1: Industry Selector Tabs */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block text-center">
            Select Your Business Industry
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {INDUSTRY_DATA.map(ind => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  selectedIndustry === ind.id
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-lg shadow-[#FF6B35]/25 scale-105'
                    : 'bg-[#1A1A2E]/80 border-[#2A2A45] text-gray-300 hover:text-white hover:border-gray-500'
                }`}
              >
                {ind.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Budget Slider */}
        <div className="bg-[#1A1A2E]/60 border border-[#2A2A45] rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Ad & Campaign Budget</span>
              <p className="text-xs text-gray-500 mt-0.5">Budget dedicated to Meta & Google ads + creative execution</p>
            </div>
            <div className="text-right">
              <span className="text-3xl md:text-4xl font-black font-mono text-[#10B981]">
                ₹{monthlyBudget.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 ml-1">/ month</span>
            </div>
          </div>

          {/* Slider input */}
          <input
            type="range"
            min={15000}
            max={300000}
            step={5000}
            value={monthlyBudget}
            onChange={e => setMonthlyBudget(Number(e.target.value))}
            className="w-full h-2.5 bg-[#0F0F1A] rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
          />

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-1 justify-end">
            <span className="text-xs text-gray-500 mr-2 self-center">Quick Presets:</span>
            {[25000, 50000, 100000, 200000].map(val => (
              <button
                key={val}
                onClick={() => setMonthlyBudget(val)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                  monthlyBudget === val
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                    : 'bg-[#0F0F1A] border-[#2A2A45] text-gray-400 hover:text-white'
                }`}
              >
                ₹{(val / 1000)}K
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Projected Outcomes Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#121224] border border-[#1E1E35] rounded-2xl p-5 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Monthly Reach</span>
            <p className="text-2xl md:text-3xl font-black font-mono text-white">
              {calculations.estReach.toLocaleString('en-IN')}+
            </p>
            <p className="text-[10px] text-gray-500">Target city impressions</p>
          </div>

          <div className="bg-[#121224] border border-[#FF6B35]/40 rounded-2xl p-5 text-center space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#FF6B35] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
              Primary KPI
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">Qualified Leads</span>
            <p className="text-2xl md:text-3xl font-black font-mono text-white">
              {calculations.estLeadsMin} - {calculations.estLeadsMax}
            </p>
            <p className="text-[10px] text-gray-400">Inbound inquiries</p>
          </div>

          <div className="bg-[#121224] border border-[#1E1E35] rounded-2xl p-5 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Conversions</span>
            <p className="text-2xl md:text-3xl font-black font-mono text-[#10B981]">
              {calculations.estCustomersMin} - {calculations.estCustomersMax}
            </p>
            <p className="text-[10px] text-gray-500">Paying customers closed</p>
          </div>

          <div className="bg-[#121224] border border-[#1E1E35] rounded-2xl p-5 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expected ROAS</span>
            <p className="text-2xl md:text-3xl font-black font-mono text-purple-400">
              {activeIndustry.typicalRoas}
            </p>
            <p className="text-[10px] text-gray-500">Return on ad spend</p>
          </div>
        </div>

        {/* Step 4: Revenue Impact Summary & WhatsApp CTA */}
        <div className="bg-gradient-to-r from-[#18112C] via-[#241320] to-[#1D0F08] border border-[#FF6B35]/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Projected Gross Revenue:</span>
              <span className="text-xl font-black font-mono text-white">
                ₹{calculations.estRevenueMin.toLocaleString('en-IN')} - ₹{calculations.estRevenueMax.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-md">
              Recommended Agency Retainer for this scale: <strong className="text-white">{activeIndustry.recommendedPackage}</strong> with daily Reels & Meta ad management.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {onSelectPlan && (
              <button
                type="button"
                onClick={() => onSelectPlan(activeIndustry.recommendedPackage.split(' ')[0])}
                className="w-full sm:w-auto bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/25 transition-all hover:scale-105 whitespace-nowrap cursor-pointer"
              >
                <Sparkles size={15} /> Book {activeIndustry.recommendedPackage.split(' ')[0]} Retainer
              </button>
            )}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_AGENCY_PHONE || '917276119511'}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold px-8 py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 whitespace-nowrap"
            >
              <PhoneCall size={15} /> Lock In Blueprint on WhatsApp <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
