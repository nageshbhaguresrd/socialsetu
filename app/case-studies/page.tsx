'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, BarChart3, Users, Building2, Utensils, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const cases = [
  {
    title: "12 Crores in Sales for Delhi Luxury Apartment",
    industry: "Real Estate",
    location: "Delhi NCR",
    metric: "CPL Reduced by 77%",
    stats: { spent: "₹4.5L", revenue: "₹12Cr+", cpl: "₹180" },
    description: "Our high-intent cinematic tour funnel converted cold leads into site visits within 48 hours.",
    icon: Building2,
    color: "bg-blue-500"
  },
  {
    title: "3M+ Views for Pune Cafe's New Summer Menu",
    industry: "Hospitality",
    location: "Pune, Maharashtra",
    metric: "3X Table Bookings",
    stats: { views: "3.2M", spend: "₹85k", roi: "12X" },
    description: "Combining hyper-local Reels with meta-targeting, we filled every table for 5 consecutive weekends.",
    icon: Utensils,
    color: "bg-orange-500"
  },
  {
    title: "Scaling a Mumbai D2C Brand to 1Cr/Month",
    industry: "D2C Fashion",
    location: "Mumbai",
    metric: "ROAS increased from 1.2 to 4.8",
    stats: { roas: "4.8X", scale: "10X Revenue", uac: "₹320" },
    description: "Creative-led growth strategy focused on UGC content and catalog automation.",
    icon: ShoppingBag,
    color: "bg-pink-500"
  }
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="p-6 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-tighter">SocialSetu<span className="text-indigo-600">.</span></Link>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-indigo-600">Main</Link>
            <Link href="/landing" className="hover:text-indigo-600">Free Audit</Link>
            <Link href="/blog" className="hover:text-indigo-600">Blog</Link>
          </div>
          <Link href="/landing" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">Start Your Story</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black tracking-tight mb-6"
        >
          Results That Speak <br /> <span className="text-indigo-600 italic">Louder Than Claims.</span>
        </motion.h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          We don&apos;t settle for &apos;impressions&apos;. We deliver revenue, footfalls, and high-quality leads for Indian businesses.
        </p>
      </section>

      {/* Case Grid */}
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-12">
          {cases.map((cs, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row gap-10 items-center p-8 md:p-12 rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden group`}
            >
              <div className="w-full md:w-1/2">
                <div className={`w-12 h-12 ${cs.color} text-white rounded-2xl flex items-center justify-center mb-6`}>
                  <cs.icon />
                </div>
                <div className="text-sm font-bold text-indigo-600 mb-2">{cs.industry} • {cs.location}</div>
                <h2 className="text-3xl font-black mb-4 leading-tight">{cs.title}</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">{cs.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(cs.stats).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-2xl font-black text-slate-900">{v}</div>
                      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">{k}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-1/2 aspect-video bg-white rounded-3xl overflow-hidden shadow-2xl relative group-hover:scale-[1.02] transition-transform flex items-center justify-center">
                 <div className="text-center p-10">
                    <BarChart3 className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                    <div className="text-slate-400 font-mono text-sm">[Data Visualization Overlay Placeholder]</div>
                    <div className="text-indigo-600 font-bold mt-4">{cs.metric}</div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-indigo-600 text-white text-center">
        <div className="px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black mb-8">Want Results Like These?</h2>
          <p className="text-indigo-100 mb-10 text-lg">Your business could be our next success story. Let&apos;s build your growth funnel together.</p>
          <Link href="/landing" className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-100 transition-all inline-block">
            Claim Your Free Audit
          </Link>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        © 2026 SocialSetu Digital Agency. ROI Specialists.
      </footer>
    </div>
  );
}
