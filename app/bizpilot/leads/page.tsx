'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Phone,
  Mail,
  Building,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';
import { Lead, LeadStatus } from '@/src/types/bizpilot';

const STATUSES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'contacted', label: 'Contacted', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'interested', label: 'Interested', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'won', label: 'Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'lost', label: 'Lost', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function LeadsCRMPage() {
  const { activeBusiness, lang } = useBizPilot();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'Direct',
    requirement: '',
    notes: '',
    status: 'new' as LeadStatus,
    next_follow_up_at: '',
  });

  const [aiDraftMessage, setAiDraftMessage] = useState<{ leadName: string; text: string } | null>(null);

  const loadLeads = async (bizId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads?business_id=${bizId}&status=${filterStatus}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      loadLeads(activeBusiness.id);
    }
  }, [activeBusiness?.id, filterStatus, search]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !newLead.name) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          ...newLead,
          next_follow_up_at: newLead.next_follow_up_at || null,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewLead({
          name: '',
          phone: '',
          email: '',
          company: '',
          source: 'Direct',
          requirement: '',
          notes: '',
          status: 'new',
          next_follow_up_at: '',
        });
        loadLeads(activeBusiness.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    if (!activeBusiness?.id) return;
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadLeads(activeBusiness.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Phone', 'Email', 'Company', 'Source', 'Status', 'Requirement', 'FollowUpDate'];
    const rows = leads.map((l) => [
      `"${l.name}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.company || ''}"`,
      `"${l.source || ''}"`,
      `"${l.status}"`,
      `"${(l.requirement || '').replace(/"/g, '""')}"`,
      `"${l.next_follow_up_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeBusiness?.slug || 'bizpilot'}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDraftAIFollowUp = (lead: Lead) => {
    const greeting = lang === 'mr' ? 'नमस्कार' : lang === 'hi' ? 'नमस्ते' : 'Hi';
    const draft = `${greeting} ${lead.name}! Hope you are doing well.\n\nFollowing up regarding your inquiry for ${lead.requirement || 'our products/services'} with ${activeBusiness?.name || 'our company'}.\n\nWould you have 5 minutes today for a quick call or discussion? Let us know what time works best for you!`;
    setAiDraftMessage({ leadName: lead.name, text: draft });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-[#2563EB]" /> {t(lang, 'crm.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(lang, 'crm.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download size={14} /> {t(lang, 'common.export')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> {t(lang, 'crm.addLeadTitle')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'common.search')}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Pipeline View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STATUSES.map((st) => {
            const columnLeads = leads.filter((l) => l.status === st.id);
            return (
              <div key={st.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col min-w-[220px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                  {columnLeads.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No leads
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-bold text-slate-800">{lead.name}</h4>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="interested">Interested</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>

                        {lead.company && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building size={11} className="text-slate-400" /> {lead.company}
                          </p>
                        )}

                        {lead.phone && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                            <Phone size={11} className="text-slate-400" /> {lead.phone}
                          </p>
                        )}

                        {lead.requirement && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {lead.requirement}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          {lead.next_follow_up_at ? (
                            <span className="text-amber-600 font-semibold flex items-center gap-1">
                              <Calendar size={11} /> {new Date(lead.next_follow_up_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">No date set</span>
                          )}

                          <button
                            onClick={() => handleDraftAIFollowUp(lead)}
                            className="text-[#2563EB] hover:underline font-bold flex items-center gap-1"
                            title="AI Draft WhatsApp Message"
                          >
                            <Sparkles size={11} /> Draft AI
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Company</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Source</th>
                <th className="p-3.5">Follow-up</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900">{l.name}</td>
                    <td className="p-3.5 text-slate-500">{l.company || '—'}</td>
                    <td className="p-3.5 font-mono">{l.phone || '—'}</td>
                    <td className="p-3.5">
                      <select
                        value={l.status}
                        onChange={(e) => handleStatusChange(l.id, e.target.value as LeadStatus)}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none cursor-pointer"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-slate-500">{l.source}</td>
                    <td className="p-3.5 text-amber-700 font-semibold">
                      {l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDraftAIFollowUp(l)}
                        className="text-xs text-[#2563EB] hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <Sparkles size={12} /> AI Draft
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Draft Message Modal */}
      {aiDraftMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-[#2563EB]" /> AI Follow-up Message for {aiDraftMessage.leadName}
              </h3>
              <button onClick={() => setAiDraftMessage(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <textarea
              rows={6}
              value={aiDraftMessage.text}
              onChange={(e) => setAiDraftMessage({ ...aiDraftMessage, text: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiDraftMessage.text);
                  alert('Copied to clipboard! Ready to paste into WhatsApp or Email.');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Copy to WhatsApp
              </button>
              <button
                onClick={() => setAiDraftMessage(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-[#2563EB]" /> {t(lang, 'crm.addLeadTitle')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {t(lang, 'crm.leadName')} *
                </label>
                <input
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="e.g. Anand Kulkarni"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t(lang, 'crm.phone')}
                  </label>
                  <input
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+91 98220 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t(lang, 'crm.company')}
                  </label>
                  <input
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    placeholder="e.g. Kulkarni Enterprises"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {t(lang, 'crm.requirement')}
                </label>
                <input
                  value={newLead.requirement}
                  onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
                  placeholder="e.g. Needs 50 units for next week shipment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t(lang, 'crm.source')}
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="Direct">Direct / Walk-in</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook Ads</option>
                    <option value="Referral">Client Referral</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {t(lang, 'crm.followUpDate')}
                  </label>
                  <input
                    type="date"
                    value={newLead.next_follow_up_at}
                    onChange={(e) => setNewLead({ ...newLead, next_follow_up_at: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
