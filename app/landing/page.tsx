'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Clock, TrendingUp, Users, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleAuditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('website'),
      source: 'audit_form'
    };

    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error();
      setFormSuccess(true);
    } catch {
      alert("Something went wrong. Please WhatsApp us.");
    } finally {
      setFormLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Promotion Bar */}
      <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
        Limited Time: Only 5 Free Audit Slots Left for this Week! ⏳
      </div>

      {/* Hero Section */}
      <header className="py-12 md:py-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-wider mb-6">
            Free 30-Minute Social Media Audit
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
            Stop Burning Cash on Ads. <br />
            <span className="text-indigo-600">Start Scaling Profitably.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            We’ve managed ₹50Cr+ in ad spend for Indian brands. Let us audit your Instagram, Facebook, and Google Ads account — <span className="font-bold underline decoration-indigo-500 underline-offset-4 text-slate-900">absolutely free (Worth ₹5,000).</span>
          </p>

          {/* Form / CTA */}
          <div id="audit-form" className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 text-left">
            {formSuccess ? (
              <div className="text-center py-10">
                <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold">Audit Requested!</h3>
                <p className="text-slate-600 mt-2">We&apos;ll contact you within 2 hours.</p>
              </div>
            ) : (
            <>
            <h3 className="text-xl font-bold mb-6 text-center">Claim Your Free Audit Now</h3>
            <form className="space-y-4" onSubmit={handleAuditSubmit}>
              <div>
                <label className="block text-sm font-semibold mb-1.5 ml-1">Your Name</label>
                <input type="text" name="name" placeholder="e.g. Rahul Sharma" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 ml-1">Business Website / Instagram Handle</label>
                <input type="text" name="website" placeholder="e.g. @yourbrand" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 ml-1">Email</label>
                  <input type="email" name="email" placeholder="rahul@company.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 ml-1">WhatsApp Phone</label>
                  <input type="tel" name="phone" placeholder="+91" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" required />
                </div>
              </div>
              <button type="submit" disabled={formLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95 mt-4">
                {formLoading ? 'Sending...' : 'Get My Free Audit (Worth ₹5,000)'}
              </button>
              <p className="text-xs text-slate-400 text-center mt-4">
                By signing up, you agree to receive a 1-on-1 strategy call. No obligation to purchase.
              </p>
            </form>
            </>
            )}
          </div>
        </motion.div>
      </header>

      {/* Trust Badges */}
      <section className="bg-white py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="text-xl font-black italic tracking-tighter">Mumbai Real Estate</div>
            <div className="text-xl font-black italic tracking-tighter">Delhi D2C Brands</div>
            <div className="text-xl font-black italic tracking-tighter">Pune BizHub</div>
            <div className="text-xl font-black italic tracking-tighter">Bangalore Startups</div>
          </div>
        </div>
      </section>

      {/* Why Choose Us / Value Prop */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
              <TrendingUp />
            </div>
            <h4 className="text-xl font-bold mb-3">₹50Cr+ Managed</h4>
            <p className="text-slate-600">We know what works in the Indian market. No theory, just proven ad strategies.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <CheckCircle />
            </div>
            <h4 className="text-xl font-bold mb-3">High-Intent Leads</h4>
            <p className="text-slate-600">Stop wasting time on &apos;junk leads&apos;. We build qualifiers that bring you real buyers.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
              <Clock />
            </div>
            <h4 className="text-xl font-bold mb-3">20+ Metros Served</h4>
            <p className="text-slate-600">From Mumbai to Nashik, we understand regional nuances and local intent.</p>
          </div>
        </div>
      </section>

      {/* Social Proof Quote */}
      <section className="py-20 bg-slate-900 text-white text-center rounded-[3rem] mx-4 md:mx-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-500 rounded-full blur-[100px]" />
        </div>
        <div className="px-6 max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
            &quot;They reduced our cost-per-lead from ₹800 to ₹180 in just 3 months for our Delhi project.&quot;
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-indigo-200 rounded-full border-2 border-indigo-400" />
            <div className="text-left">
              <div className="font-bold">Rahul Verma</div>
              <div className="text-sm text-slate-400">Marketing Head, SkyVista Realty</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Small Section */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold mb-10 text-center">Frequently Asked Questions</h3>
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-100">
            <h5 className="font-bold mb-2">Is the audit really free?</h5>
            <p className="text-sm text-slate-600">Yes, 100%. We believe in showing value first. No credit card, no hidden fees.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-100">
            <h5 className="font-bold mb-2">What happens on the 30-min call?</h5>
            <p className="text-sm text-slate-600">We analyze your ads, profile, and sales funnel. You leave with a concrete growth roadmap.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-100">
            <h5 className="font-bold mb-2">Which platforms do you audit?</h5>
            <p className="text-sm text-slate-600">Meta (Instagram/Facebook), Google Ads, and your landing page conversion rate.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6 text-center">
        <p className="text-slate-500 text-sm mb-6">© 2026 SocialSetu Digital Agency. Pan-India Presence.</p>
        <div className="flex justify-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Main Site</Link>
          <Link href="/case-studies" className="hover:text-indigo-600 transition-colors">Case Studies</Link>
          <Link href="/blog" className="hover:text-indigo-600 transition-colors">SMM Blog</Link>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <Link href="#audit-form">
          <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2">
            Claim Your Free Audit ⚡
          </button>
        </Link>
      </div>
    </div>
  );
}
