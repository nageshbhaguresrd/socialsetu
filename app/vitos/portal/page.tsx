'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  Headphones,
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  Check,
  ArrowRight,
  MessageCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function ClientPortalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'proposals' | 'invoices' | 'tickets'>('overview');
  const [requirementText, setRequirementText] = useState('');
  const [selectedService, setSelectedService] = useState('Website Development');
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);
  const [requirementSuccess, setRequirementSuccess] = useState(false);

  // Support Chat with AI Assistant
  const [supportMessage, setSupportMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'client' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: 'Hello! I am Emily Watson, your designated AI Client Success Lead. How can I assist you with your active projects or new service requests today?',
      time: '10:00 AM',
    },
  ]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Proposal State
  const [proposalApproved, setProposalApproved] = useState(false);

  const handleSendChat = () => {
    if (!supportMessage.trim()) return;
    const msg = supportMessage.trim();
    setChatLog((prev) => [...prev, { sender: 'client', text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setSupportMessage('');
    setIsSendingMessage(true);

    setTimeout(() => {
      let reply = 'Thank you for reaching out! I have notified our engineering team and logged this into your project workspace.';
      if (msg.toLowerCase().includes('status') || msg.toLowerCase().includes('progress')) {
        reply = 'Your Web Application Development sprint is currently at 85% completion. The Frontend Architect and Database Architect have completed all milestone deliverables.';
      } else if (msg.toLowerCase().includes('quote') || msg.toLowerCase().includes('invoice') || msg.toLowerCase().includes('cost')) {
        reply = 'Your quotation for ₹1,85,000 has been prepared by our Accounting Agent. You can review and approve it directly in the Proposals tab.';
      }
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsSendingMessage(false);
    }, 700);
  };

  const handleSubmitRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementText.trim()) return;
    setIsSubmittingRequirement(true);
    setTimeout(() => {
      setIsSubmittingRequirement(false);
      setRequirementSuccess(true);
      setRequirementText('');
      setTimeout(() => setRequirementSuccess(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Client Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
            AP
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Apex Global Logistics Client Workspace</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE CLIENT
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Account ID: CLI-8849 | Dedicated Success Manager: Emily Watson (AI)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/vitos"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            ← Founder OS Dashboard
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 flex gap-6 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Workspace Overview', icon: Globe },
          { id: 'projects', label: 'Active Projects (2)', icon: FolderKanban },
          { id: 'proposals', label: 'Quotations & SOWs', icon: FileText },
          { id: 'invoices', label: 'Invoices & Billing', icon: DollarSign },
          { id: 'tickets', label: 'Support & AI Helpdesk', icon: Headphones },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                isActive ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Status Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Active Milestone Sprint</span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Sprint Delivery on Track
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Full-Stack Freight Booking Portal & API Integration</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Development Studio agents (Alex Rivera, Tariq Al-Mansoor, and Priya Sundaram) have finalized normalized schemas, authentication, and responsive React 19 dashboards.
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full w-[85%]"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Progress: 85% Completed</span>
                <span>Target Delivery: Dec 5, 2026</span>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Submit Project Requirement */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Request New IT Service or Feature</span>
                </h3>
                <form onSubmit={handleSubmitRequirement} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Service Category:</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option>Website Development</option>
                      <option>Web Application Development</option>
                      <option>Mobile Application Development</option>
                      <option>Cybersecurity Assessment</option>
                      <option>SEO & Search Engine Optimisation</option>
                      <option>Cloud Hosting & Server Management</option>
                      <option>Business Automation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Project Brief & Requirements:</label>
                    <textarea
                      value={requirementText}
                      onChange={(e) => setRequirementText(e.target.value)}
                      placeholder="Describe what you want our AI engineers to build or configure..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRequirement || !requirementText.trim()}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingRequirement ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting to CEO Agent...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Project Requirement</span>
                      </>
                    )}
                  </button>

                  {requirementSuccess && (
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center">
                      ✓ Requirement submitted! CEO Victoria Vance is generating your execution plan and proposal.
                    </div>
                  )}
                </form>
              </div>

              {/* Live Support Concierge */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>24/7 AI Support Assistant (Emily Watson)</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {chatLog.map((c, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                          c.sender === 'client'
                            ? 'bg-indigo-600/30 text-indigo-100 ml-6 border border-indigo-500/30'
                            : 'bg-slate-950 text-slate-300 mr-6 border border-slate-800'
                        }`}
                      >
                        <p>{c.text}</p>
                        <span className="text-[9px] text-slate-500 block text-right mt-1">{c.time}</span>
                      </div>
                    ))}
                    {isSendingMessage && (
                      <div className="p-2 text-xs text-slate-400 italic flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Emily is analyzing...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                  <input
                    type="text"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Ask about project status, invoices, or bug fixes..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  />
                  <button
                    onClick={handleSendChat}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Quotations & Statements of Work (SOW)</h2>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-white">SOW-2026-042: Custom B2B Customer Portal & API</h3>
                  <span className="text-xs text-slate-400">Prepared by David Hayes (Proposal & Scope Drafter)</span>
                </div>
                <span className="text-base font-black text-emerald-400">₹1,85,000 + GST</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p><strong>Deliverables Included:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Full responsive Next.js 15 App Router architecture with Tailwind CSS</li>
                  <li>PostgreSQL database schema with Tenant-Level Row-Level Security</li>
                  <li>RESTful API endpoints with authentication and role-based permissions</li>
                  <li>Cloud deployment to AWS with 99.98% uptime SLA monitoring</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Validity: Valid until Dec 15, 2026</span>
                {proposalApproved ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approved & Commissioned</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setProposalApproved(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Proposal & Authorize Kickoff</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Invoices & Payment Records</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              {[
                { number: 'INV-2026-088', desc: 'Milestone 1: Architecture & Database Design', amount: 92500, status: 'PAID', date: 'Nov 15, 2026' },
                { number: 'INV-2026-089', desc: 'Milestone 2: Frontend & API Integration', amount: 92500, status: 'DUE IN 10 DAYS', date: 'Dec 01, 2026' },
              ].map((inv, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{inv.number}</span>
                    <span className="text-slate-400 block">{inv.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">₹{inv.amount.toLocaleString('en-IN')}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase block mt-0.5 ${
                        inv.status === 'PAID' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Projects Workspace</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-sm text-white">Apex Logistics Portal (Web App)</span>
                <span className="text-xs text-indigo-400 font-mono">Status: In Progress</span>
              </div>
              <p className="text-xs text-slate-300">Repository connected: github.com/apex-logistics/portal-v1</p>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Support Tickets & SLA Tracking</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-white">TICK-402: Add webhook for instant freight SMS notifications</span>
                  <span className="text-slate-400 block">Assigned to: Vikram Joshi (API Integration Agent)</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">RESOLVED</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
