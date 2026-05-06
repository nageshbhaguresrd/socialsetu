'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from '@/lib/supabase/client';
import { leadSchema } from '@/lib/validation/schemas';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Users,
  LayoutDashboard,
  Trello,
  List,
  Bell,
  MessageSquare,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  Bot,
  Smartphone,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Filter,
  ArrowRight,
  MapPin,
  Briefcase,
  DollarSign,
  Star,
  Check,
  ChevronLeft,
  X,
  Activity,
  BarChart2
} from "lucide-react";
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
  LineChart,
  Line
} from 'recharts';

/* ─── TYPES ─────────────────────────────────────────────── */

export interface Lead {
  id: string;
  name: string;
  business: string;
  city: string;
  industry: string;
  budget: string;
  source: string;
  stage: string;
  phone: string;
  email: string;
  notes: string;
  value: number;
  createdAt: string;
  lastContact: string;
  aiScore: number;
  priority: "High" | "Medium" | "Low";
}

type LeadForm = Partial<Lead> & {
  ai_score?: number;
};

interface Reminder {
  id: number;
  leadId: string | number;
  type: "call" | "followup" | "audit" | "proposal" | "closing";
  note: string;
  dueDate: string;
  dueTime: string;
  done: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  client: string;
  platform: string;
  budget: number;
  spent: number;
  leads_generated: number;
  conversions: number;
  status: 'Active' | 'Paused' | 'Completed';
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

interface WATemplate {
  id: string
  name: string
  body: string
  variables?: string[]
}

/* ─── CONSTANTS ─────────────────────────────────────────── */
const STAGES = ["New Lead", "Contacted", "Audit Done", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"];
const INDUSTRIES = ["Restaurant/Food", "Real Estate", "IT/SaaS", "D2C/eCommerce", "Healthcare", "Education", "Other"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Other"];
const PRIORITIES = ["High", "Medium", "Low"] as const;

const REMINDER_TYPES = [
  { id: "call", label: "Phone Call" },
  { id: "followup", label: "Follow-up" },
  { id: "audit", label: "Brand Audit" },
  { id: "proposal", label: "Proposal Sent" },
  { id: "closing", label: "Final Closing" },
];

const COLORS = {
  primary: "#FF6B35",
  secondary: "#10B981",
  accent: "#8B5CF6",
  danger: "#EF4444",
  warning: "#F59E0B",
  bg: "#080812",
  card: "#0F0F1A",
  muted: "#1E1E35",
  text: "#B0B8C8"
};

const STAGE_COLORS: Record<string, string> = {
  "New Lead": "#3B82F6",
  "Contacted": "#8B5CF6",
  "Audit Done": "#F59E0B",
  "Proposal Sent": "#EC4899",
  "Negotiation": "#FF6B35",
  "Closed Won": "#10B981",
  "Closed Lost": "#EF4444",
};

const initialReminders: Reminder[] = [
  { id: 1, leadId: "lead_001", type: "closing", note: "Final call for closing", dueDate: "2024-12-28", dueTime: "11:00", done: false, createdAt: "2024-12-21" },
  { id: 2, leadId: "lead_002", type: "followup", note: "Follow up on proposal", dueDate: "2024-12-27", dueTime: "14:00", done: false, createdAt: "2024-12-21" },
];

/* ─── UTILITIES ─────────────────────────────────────────── */
const formatCurrency = (val: number) => `₹${(val / 1000).toFixed(1)}k`;

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'created': return 'bg-green-500';
    case 'stage_change': return 'bg-blue-500';
    case 'updated': return 'bg-yellow-500';
    case 'wa_sent': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const openWhatsApp = (lead: Lead, msg: string) => {
  const url = `https://wa.me/91${lead.phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");

  fetch(`/api/leads/${lead.id}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'wa_sent',
      description: `WhatsApp message sent to ${lead.phone}`,
    }),
  }).catch(console.error);
};

/* ─── COMPONENTS ────────────────────────────────────────── */

const Badge = ({ children, color, className = "" }: { children: React.ReactNode; color: string; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${className}`} style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
    {children}
  </span>
);

const ScoreRing = ({ score }: { score: number }) => {
  const color = score >= 80 ? COLORS.secondary : score >= 60 ? COLORS.warning : COLORS.danger;
  return (
    <div className="relative flex items-center justify-center h-8 w-8">
      <svg className="h-full w-full rotate-[-90deg]">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#1E1E35" strokeWidth="3" />
        <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="3" strokeDasharray={88} strokeDashoffset={88 - (88 * score) / 100} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="absolute text-[9px] font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
};

/* ─── CAMPAIGNS VIEW ─────────────────────────────────────── */

const CampaignsView = ({ 
  campaigns = [], 
  loading = false, 
  onRefresh = () => {}, 
  editingCampaign = null, 
  setEditingCampaign = () => {}, 
  showModal = false, 
  setShowModal = () => {} 
}: {
  campaigns?: Campaign[];
  loading?: boolean;
  onRefresh?: () => void;
  editingCampaign?: Campaign | null;
  setEditingCampaign?: (c: Campaign | null) => void;
  showModal?: boolean;
  setShowModal?: (b: boolean) => void;
}) => {
  const stats = useMemo(() => {
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads_generated, 0);
    const totalConvs = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const active = campaigns.filter(c => c.status === 'Active').length;
    
    return {
      totalBudget,
      totalSpent,
      totalLeads,
      totalConvs,
      active,
      roi: totalBudget > 0 ? ((totalConvs / totalLeads) * 100).toFixed(1) : '0'
    };
  }, [campaigns]);

  const chartData = useMemo(() => {
    const platforms = ['Meta', 'Google', 'LinkedIn', 'YouTube'];
    return platforms.map(p => ({
      name: p,
      leads: campaigns.filter(c => c.platform === p).reduce((sum, c) => sum + c.leads_generated, 0),
      spent: campaigns.filter(c => c.platform === p).reduce((sum, c) => sum + c.spent, 0)
    }));
  }, [campaigns]);

  const [campaignForm, setCampaignForm] = useState({
    name: '', client: '', platform: 'Meta',
    budget: 0, start_date: '', status: 'Active', notes: ''
  });

  const handleSaveCampaign = async (formData: Partial<Campaign>) => {
    const url = editingCampaign ? `/api/campaigns/${editingCampaign.id}` : '/api/campaigns';
    const method = editingCampaign ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      onRefresh();
      setShowModal(false);
      setEditingCampaign(null);
    } else {
      alert('Failed to save campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    
    if (res.ok) {
      onRefresh();
    } else {
      alert('Failed to delete campaign');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Campaigns', val: stats.active, icon: Activity },
            { label: 'Total Leads', val: stats.totalLeads.toLocaleString(), icon: Users },
            { label: 'Total Conversions', val: stats.totalConvs.toLocaleString(), icon: TrendingUp },
            { label: 'Total Budget', val: `₹${(stats.totalBudget/1000).toFixed(0)}k`, icon: DollarSign }
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-[#0F0F1A] border border-[#1E1E35] p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <s.icon size={18} className="text-primary" />
                </div>
                <span className="text-xs text-text font-medium">{s.label}</span>
              </div>
              <div className="text-2xl font-bold font-poppins">{s.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Platform Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0F0F1A] border border-[#1E1E35] p-6 rounded-2xl">
            <h3 className="font-poppins font-bold text-sm mb-4">Platform Performance</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#1E1E35" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4A4A6A', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#4A4A6A', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="url(#colorLeads)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-[#0F0F1A] border border-[#1E1E35] p-6 rounded-2xl">
            <h3 className="font-poppins font-bold text-sm mb-4">Budget Burn Rate</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#1E1E35" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4A4A6A', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#4A4A6A', fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="spent" stroke={COLORS.accent} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-poppins font-bold text-sm uppercase tracking-widest text-text">Live Campaigns</h4>
            <button onClick={onRefresh} className="text-xs text-text hover:text-white">Refresh</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.filter(c => c.status === 'Active').map(c => (
              <motion.div
                key={c.id}
                layout
                className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-6 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Active</span>
                  </div>
                  <MoreVertical size={16} className="opacity-50 group-hover:opacity-100" />
                </div>
                <h5 className="font-poppins font-bold text-lg mb-2">{c.name}</h5>
                <div className="text-xs text-text mb-4">{c.client} • {c.platform}</div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-text">Budget</span>
                    <span className="font-mono font-bold">₹{(c.budget/1000).toFixed(0)}k</span>
                  </div>
                  <div className="w-full bg-[#1E1E35] rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all" 
                      style={{ width: `${(c.spent / c.budget) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>₹{(c.spent/1000).toFixed(1)}k</span>
                    <span className="font-bold">{Math.round(c.leads_generated / (c.conversions || 1))} CPL</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="text-center p-3 bg-[#1A1A2E]/50 rounded-xl">
                    <div className="font-bold text-primary mb-1">{c.leads_generated}</div>
                    <div className="text-text/70 text-[10px]">Leads</div>
                  </div>
                  <div className="text-center p-3 bg-[#1A1A2E]/50 rounded-xl">
                    <div className="font-bold text-secondary mb-1">{c.conversions}</div>
                    <div className="text-text/70 text-[10px]">Conversions</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
          <div className="bg-[#0B0B18] border border-[#1E1E35] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold font-poppins">
                {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[#1E1E35] rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Campaign Name</label>
                <input
                  className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50 transition-all"
                  placeholder="Summer Sale Meta Ads"
                  value={campaignForm.name}
                  onChange={e => setCampaignForm(p => ({...p, name: e.target.value}))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Client</label>
                  <input
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50 transition-all"
                    placeholder="Raj Restaurant"
                    value={campaignForm.client}
                    onChange={e => setCampaignForm(p => ({...p, client: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Platform</label>
                  <select
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                    value={campaignForm.platform}
                    onChange={e => setCampaignForm(p => ({...p, platform: e.target.value}))}
                  >
                    <option value="Meta">Meta Ads</option>
                    <option value="Google">Google Ads</option>
                    <option value="LinkedIn">LinkedIn Ads</option>
                    <option value="YouTube">YouTube Ads</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Budget ₹</label>
                  <input
                    type="number"
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                    placeholder="50000"
                    value={campaignForm.budget}
                    onChange={e => setCampaignForm(p => ({...p, budget: Number(e.target.value)}))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                    value={campaignForm.start_date}
                    onChange={e => setCampaignForm(p => ({...p, start_date: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Status</label>
                <select
                  className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                  value={campaignForm.status}
                  onChange={e => setCampaignForm(p => ({...p, status: e.target.value}))}
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Notes</label>
                <textarea
                  className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm h-32 focus:border-primary/50 resize-vertical"
                  placeholder="Campaign objectives, creative notes..."
                  value={campaignForm.notes}
                  onChange={e => setCampaignForm(p => ({...p, notes: e.target.value}))}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 font-bold text-text hover:text-white rounded-2xl border border-[#1E1E35] transition-all"
                >
                  Cancel
                </button>
                <Btn 
                  className="flex-1 py-4" 
                  onClick={() => handleSaveCampaign(campaignForm)}
                >Save Campaign</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM SCROLLBAR CSS ── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #080812;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E1E35;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #25254A;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ─── AUDITS LIST VIEW ─── */

const AuditsListView = () => {
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(data => { setAudits(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const scoreColor = (s: number) =>
    s >= 70 ? COLORS.secondary : s >= 50 ? COLORS.warning : COLORS.danger

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-poppins">Social Media Audits</h2>
          <p className="text-sm text-text mt-1">AI-powered audits for your clients</p>
        </div>
        <Btn onClick={() => window.location.href = '/audit/new'}>
          + New Audit
        </Btn>
      </div>

      {loading ? (
        <div className="text-center text-text py-20">Loading audits...</div>
      ) : audits.length === 0 ? (
        <div className="text-center py-20 bg-[#0F0F1A] rounded-2xl border border-[#1E1E35]">
          <p className="text-text mb-4">No audits yet</p>
          <Btn onClick={() => window.location.href = '/audit/new'}>
            Run your first audit
          </Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audits.map((a: any) => (
            <div
              key={a.id}
              onClick={() => window.location.href = `/audit/${a.id}`}
              className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-6 hover:border-primary/40 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold font-poppins">{a.client_name}</h3>
                  <p className="text-xs text-text mt-1">
                    {new Date(a.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {a.status === 'completed' && a.scores?.overall ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: scoreColor(a.scores.overall) }}>
                      {a.scores.overall}
                    </div>
                    <div className="text-[10px] text-text">Score</div>
                  </div>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    background: a.status === 'processing' ? '#1A1A0A' : a.status === 'failed' ? '#2A0F0F' : '#0F1A0F',
                    color: a.status === 'processing' ? '#F59E0B' : a.status === 'failed' ? '#F87171' : '#4ADE80',
                  }}>
                    {a.status}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(a.platforms || {})
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A2E] text-text capitalize">
                      {k}
                    </span>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── BRAND BHAARAT CRM SHELL ─── */

function BrandBhaaratCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard'|'leads'|'pipeline'|'reminders'|'campaigns'|'whatsapp'|'ai'|'audits'>('dashboard');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [reminderForm, setReminderForm] = useState({ leadId: '', type: 'followup', note: '', dueDate: '', dueTime: '10:00' });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const fetchLeads = async () => {
      setLeadsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setLeads((data || []).map((l: any) => ({
          id: l.id, name: l.name, business: l.business, city: l.city,
          industry: l.industry, budget: l.budget, source: l.source,
          stage: l.stage, phone: l.phone, email: l.email,
          notes: l.notes || '', value: l.value,
          aiScore: l.ai_score, priority: l.priority,
          createdAt: l.created_at, lastContact: l.last_contact,
        })));
      } catch (err) {
        showToast('Failed to load leads. Please refresh.', 'error');
      } finally {
        setLeadsLoading(false);
      }
    };
    fetchLeads();
  }, [showToast]);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('reminders').select('*').order('due_date', { ascending: true });
        setReminders((data || []).map((r: any) => ({
          id: r.id, leadId: r.lead_id, type: r.type, note: r.note,
          dueDate: r.due_date, dueTime: r.due_time, done: r.done, createdAt: r.created_at,
        })));
      } catch {
        showToast('Failed to load reminders.', 'error');
      }
    };
    fetchReminders();
  }, [showToast]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data || []);
    } catch { showToast('Failed to load campaigns.', 'error'); }
  }, [showToast]);

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const filteredLeads = useMemo(() => {
    let result = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.business.toLowerCase().includes(q) || l.phone.includes(q));
    }
    if (filterStage !== 'All') result = result.filter(l => l.stage === filterStage);
    return result;
  }, [leads, search, filterStage]);

  const stats = useMemo(() => ({
    total: leads.length,
    active: leads.filter(l => !['Closed Won','Closed Lost'].includes(l.stage)).length,
    won: leads.filter(l => l.stage === 'Closed Won').reduce((s, l) => s + l.value, 0),
    pipe: leads.filter(l => !['Closed Won','Closed Lost'].includes(l.stage)).reduce((s, l) => s + l.value, 0),
  }), [leads]);

  const handleSaveLead = async (form: LeadForm) => {
    try {
      if (editingLead) {
        const res = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, business: form.business, city: form.city, industry: form.industry, budget: form.budget, phone: form.phone, email: form.email, value: form.value, priority: form.priority, notes: form.notes }),
        });
        const updated = await res.json();
        if (!res.ok) throw new Error(updated.error);
        setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...updated, aiScore: updated.ai_score, createdAt: updated.created_at, lastContact: updated.last_contact } : l));
        showToast('Lead updated ✓', 'success');
      } else {
        const supabase = createClient();
        const { data, error } = await supabase.from('leads').insert({
          name: form.name, business: form.business, city: form.city, industry: form.industry,
          budget: form.budget, phone: form.phone, email: form.email || '', value: form.value || 0,
          priority: form.priority || 'Medium', notes: form.notes || '', source: 'Manual',
          stage: 'New Lead', ai_score: 70,
        }).select().single();
        if (error) throw error;
        setLeads(prev => [{
          id: data.id, name: data.name, business: data.business, city: data.city, industry: data.industry,
          budget: data.budget, source: data.source, stage: data.stage, phone: data.phone,
          email: data.email, notes: data.notes || '', value: data.value,
          aiScore: data.ai_score, priority: data.priority, createdAt: data.created_at, lastContact: data.last_contact,
        }, ...prev]);
        showToast('Lead saved successfully ✓', 'success');
      }
      setShowLeadModal(false);
      setEditingLead(null);
    } catch { showToast('Failed to save lead. Please try again.', 'error'); }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
      showToast('Stage updated ✓', 'success');
    } catch { showToast('Failed to update stage.', 'error'); }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
      showToast('Lead deleted', 'info');
    } catch { showToast('Failed to delete lead.', 'error'); }
  };

  const handleSaveReminder = async () => {
    if (!reminderForm.leadId || !reminderForm.note || !reminderForm.dueDate) {
      showToast('Please fill all required fields', 'error'); return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('reminders').insert({
        lead_id: reminderForm.leadId, type: reminderForm.type,
        note: reminderForm.note, due_date: reminderForm.dueDate, due_time: reminderForm.dueTime,
      }).select().single();
      if (error) throw error;
      setReminders(prev => [...prev, {
        id: data.id, leadId: data.lead_id, type: data.type, note: data.note,
        dueDate: data.due_date, dueTime: data.due_time, done: data.done, createdAt: data.created_at,
      }]);
      setShowReminderModal(false);
      setReminderForm({ leadId: '', type: 'followup', note: '', dueDate: '', dueTime: '10:00' });
      showToast('Reminder set ✓', 'success');
    } catch { showToast('Failed to save reminder.', 'error'); }
  };

  const handleToggleReminder = async (id: string | number) => {
    const r = reminders.find(x => x.id === id);
    if (!r) return;
    try {
      const supabase = createClient();
      await supabase.from('reminders').update({ done: !r.done }).eq('id', id);
      setReminders(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));
      if (!r.done) showToast('Reminder completed ✓', 'success');
    } catch { showToast('Failed to update reminder.', 'error'); }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/login');
  };

  const leadModal = editingLead
    ? { name: editingLead.name, business: editingLead.business, city: editingLead.city, industry: editingLead.industry, budget: editingLead.budget, phone: editingLead.phone, email: editingLead.email, value: editingLead.value, priority: editingLead.priority, notes: editingLead.notes, stage: editingLead.stage, source: editingLead.source, ai_score: editingLead.aiScore, last_contact: editingLead.lastContact }
    : null;

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#080812] text-white font-inter overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-[#1E1E35] flex flex-col py-6">
          <div className="px-5 mb-8">
            <h2 className="text-base font-bold font-poppins text-[#FF6B35]">SocialSetu</h2>
            <p className="text-[10px] text-[#666] mt-0.5">BrandBhaarat CRM</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { key: 'leads', label: 'Leads', icon: Users },
              { key: 'pipeline', label: 'Pipeline', icon: Trello },
              { key: 'reminders', label: 'Reminders', icon: Bell },
              { key: 'campaigns', label: 'Campaigns', icon: Activity },
              { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
              { key: 'ai', label: 'AI Studio', icon: Bot },
              { key: 'audits', label: 'Audits', icon: BarChart2 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeView === key ? 'bg-[#1A1A2E] text-white font-bold' : 'text-[#666] hover:text-white hover:bg-[#0F0F1A]'}`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-4 px-8 py-4 border-b border-[#1E1E35]">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#FF6B35]/50" />
            </div>
            <div className="flex items-center gap-3">
              <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="bg-[#1A1A2E] border border-[#1E1E35] rounded-xl px-3 py-2.5 text-sm outline-none">
                <option>All</option>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => { setEditingLead(null); setShowLeadModal(true); }} className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all">
                <Plus size={16} /> New Lead
              </button>
              <button onClick={handleSignOut} className="text-[#666] hover:text-white text-sm px-3 py-2.5 rounded-xl hover:bg-[#1A1A2E] transition-all">Sign Out</button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-8">
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Leads', val: stats.total, color: '#3B82F6' },
                    { label: 'Active Pipeline', val: stats.active, color: '#8B5CF6' },
                    { label: 'Won Value', val: `₹${(stats.won/1000).toFixed(0)}k`, color: '#10B981' },
                    { label: 'Pipeline Value', val: `₹${(stats.pipe/1000).toFixed(0)}k`, color: '#FF6B35' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0F0F1A] border border-[#1E1E35] p-5 rounded-2xl">
                      <p className="text-xs text-[#666] mb-2">{s.label}</p>
                      <p className="text-2xl font-bold font-poppins" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0F0F1A] border border-[#1E1E35] p-6 rounded-2xl">
                  <h3 className="text-sm font-bold mb-4">Last 3 Months Leads</h3>
                  <AreaChart width={800} height={200} data={[
                    { month: 'Feb', val: Math.floor(stats.total * 0.4) },
                    { month: 'Mar', val: Math.floor(stats.total * 0.7) },
                    { month: 'Apr', val: stats.total },
                  ]}>
                    <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF6B35" stopOpacity={0.4}/><stop offset="100%" stopColor="#FF6B35" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#1E1E35" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="val" stroke="#FF6B35" strokeWidth={2} fill="url(#colorVal)" />
                  </AreaChart>
                </div>
              </div>
            )}

            {activeView === 'leads' && (
              <div className="space-y-4">
                {leadsLoading ? (
                  <div className="flex items-center justify-center py-20 text-[#666]">Loading leads...</div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-20 text-[#666]">No leads found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#666] text-xs uppercase tracking-widest border-b border-[#1E1E35]">
                        <th className="pb-3 text-left">Name</th>
                        <th className="pb-3 text-left">Business</th>
                        <th className="pb-3 text-left">City</th>
                        <th className="pb-3 text-left">Stage</th>
                        <th className="pb-3 text-right">Value</th>
                        <th className="pb-3 text-center">AI Score</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(l => (
                        <tr key={l.id} className="border-b border-[#1E1E35]/50 hover:bg-[#0F0F1A] transition-all">
                          <td className="py-3">{l.name}</td>
                          <td className="py-3 text-[#666]">{l.business}</td>
                          <td className="py-3 text-[#666]">{l.city}</td>
                          <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${STAGE_COLORS[l.stage] || '#666'}20`, color: STAGE_COLORS[l.stage] || '#666' }}>{l.stage}</span></td>
                          <td className="py-3 text-right font-mono">₹{(l.value / 1000).toFixed(0)}k</td>
                          <td className="py-3"><ScoreRing score={l.aiScore} /></td>
                          <td className="py-3 text-center">
                            <button onClick={() => { setEditingLead(l); setShowLeadModal(true); }} className="text-[#666] hover:text-white mr-2">Edit</button>
                            <button onClick={() => handleDeleteLead(l.id)} className="text-[#EF4444] hover:text-white mr-2">Del</button>
                            <button onClick={() => { window.location.href = `/audit/new?leadId=${l.id}&name=${encodeURIComponent(l.name)}&industry=${encodeURIComponent(l.industry)}`; }} className="text-[#8B5CF6] hover:text-white">Audit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeView === 'pipeline' && (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map(stage => (
                  <div key={stage} className="flex-shrink-0 w-64">
                    <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold" style={{ color: STAGE_COLORS[stage] || '#666' }}>{stage}</span>
                        <span className="text-[10px] text-[#666]">{leads.filter(l => l.stage === stage).length}</span>
                      </div>
                      <div className="space-y-2">
                        {leads.filter(l => l.stage === stage).map(l => (
                          <div key={l.id} className="bg-[#1A1A2E] border border-[#1E1E35] rounded-xl p-3 cursor-pointer hover:border-[#FF6B35]/40" onClick={() => { setSelectedLead(l); setShowLeadModal(true); }}>
                            <p className="text-sm font-bold truncate">{l.name}</p>
                            <p className="text-[10px] text-[#666]">{l.business}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-mono text-[10px] text-[#666]">₹{(l.value / 1000).toFixed(0)}k</span>
                              <ScoreRing score={l.aiScore} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeView === 'reminders' && (
              <div className="space-y-4">
                <button onClick={() => { setReminderForm({ leadId: '', type: 'followup', note: '', dueDate: '', dueTime: '10:00' }); setShowReminderModal(true); }} className="flex items-center gap-2 bg-[#FF6B35] text-white font-bold text-sm px-4 py-2.5 rounded-xl">
                  <Plus size={16} /> Add Reminder
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reminders.map(r => {
                    const lead = leads.find(l => l.id === r.leadId);
                    return (
                      <div key={r.id} className={`bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-5 ${r.done ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">{r.type}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleToggleReminder(r.id)} className="text-[#10B981] hover:text-white text-xs">{r.done ? 'Undo' : 'Done'}</button>
                            <button onClick={() => setReminders(prev => prev.filter(x => x.id !== r.id))} className="text-[#EF4444] hover:text-white text-xs">Del</button>
                          </div>
                        </div>
                        <p className="text-sm mb-2">{r.note}</p>
                        <p className="text-[10px] text-[#666]">{lead?.name || 'Unknown'} • {r.dueDate} {r.dueTime}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeView === 'campaigns' && (
              <CampaignsView campaigns={campaigns} loading={false} onRefresh={fetchCampaigns} editingCampaign={editingCampaign} setEditingCampaign={setEditingCampaign} showModal={showCampaignModal} setShowModal={setShowCampaignModal} />
            )}

            {activeView === 'audits' && <AuditsListView />}

            {activeView === 'whatsapp' && <div className="text-[#666] py-20 text-center">WhatsApp integration coming soon...</div>}
            {activeView === 'ai' && <div className="text-[#666] py-20 text-center">AI Studio coming soon...</div>}
          </main>
        </div>
      </div>

      {/* LeadModal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
          <div className="bg-[#0B0B18] border border-[#1E1E35] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold font-poppins">{editingLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button onClick={() => setShowLeadModal(false)} className="p-2 hover:bg-[#1E1E35] rounded-xl"><X size={24} /></button>
            </div>
            <LeadModalForm lead={editingLead} onSave={handleSaveLead} onCancel={() => setShowLeadModal(false)} />
          </div>
        </div>
      )}

      {/* ReminderModal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
          <div className="bg-[#0B0B18] border border-[#1E1E35] rounded-3xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold font-poppins">Add Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} className="p-2 hover:bg-[#1E1E35] rounded-xl"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Lead</label>
                <select value={reminderForm.leadId} onChange={e => setReminderForm(p => ({ ...p, leadId: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm">
                  <option value="">Select lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Type</label>
                <select value={reminderForm.type} onChange={e => setReminderForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm">
                  {REMINDER_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Note</label>
                <textarea value={reminderForm.note} onChange={e => setReminderForm(p => ({ ...p, note: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm h-24 resize-none" placeholder="Reminder note..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Date</label>
                  <input type="date" value={reminderForm.dueDate} onChange={e => setReminderForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Time</label>
                  <input type="time" value={reminderForm.dueTime} onChange={e => setReminderForm(p => ({ ...p, dueTime: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowReminderModal(false)} className="flex-1 py-4 font-bold text-[#666] hover:text-white rounded-2xl border border-[#1E1E35]">Cancel</button>
                <Btn className="flex-1 py-4" onClick={handleSaveReminder}>Save Reminder</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3 max-w-sm">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-[#EF4444]' : toast.type === 'success' ? 'bg-[#10B981]' : 'bg-[#3B82F6]'}`} />
          <p className="text-sm">{toast.message}</p>
          <button onClick={hideToast} className="ml-2 text-[#666] hover:text-white"><X size={14} /></button>
        </div>
      )}
    </ErrorBoundary>
  );
}

/* ─── LEAD MODAL FORM ─── */

function LeadModalForm({ lead, onSave, onCancel }: { lead: Lead | null; onSave: (form: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: lead?.name || '', business: lead?.business || '', city: lead?.city || '', industry: lead?.industry || '',
    budget: lead?.budget || '', phone: lead?.phone || '', email: lead?.email || '', value: lead?.value || 0,
    priority: lead?.priority || 'Medium', notes: lead?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { if (err.path[0]) errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {['name', 'business', 'city', 'industry'].map(f => (
          <div key={f}>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">{f}</label>
            <input value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm outline-none focus:border-[#FF6B35]/50" />
            {errors[f] && <p className="text-[#EF4444] text-[10px] mt-1">{errors[f]}</p>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {['phone', 'email'].map(f => (
          <div key={f}>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">{f}</label>
            <input type={f === 'email' ? 'email' : 'tel'} value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm outline-none focus:border-[#FF6B35]/50" />
            {errors[f] && <p className="text-[#EF4444] text-[10px] mt-1">{errors[f]}</p>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ f: 'budget', label: 'Budget' }, { f: 'value', label: 'Deal Value' }].map(({ f, label }) => (
          <div key={f}>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">{label}</label>
            <input type="number" value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: Number(e.target.value) }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm outline-none focus:border-[#FF6B35]/50" />
          </div>
        ))}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Priority</label>
          <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm">
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-[#666]">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm h-24 resize-none" />
      </div>
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 font-bold text-[#666] hover:text-white rounded-2xl border border-[#1E1E35]">Cancel</button>
        <Btn type="submit" className="flex-1 py-4">Save Lead</Btn>
      </div>
    </form>
  );
}

export default BrandBhaaratCRM;


/* ─── HELPER COMPONENTS ─── */

function Tag({ children, color = "#3B82F6" }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${color}20`, color }}>{children}</span>;
}

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  outline?: boolean;
  small?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

function Btn({ children, onClick, color = "#FF6B35", outline = false, small = false, disabled = false, style = {}, className = "" }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-poppins font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${className}`}
      style={{
        background: outline ? `${color}15` : `linear-gradient(135deg,${color},${color}cc)`,
        border: outline ? `1px solid ${color}50` : "none",
        color: outline ? color : "#fff",
        borderRadius: 12,
        padding: small ? "6px 14px" : "12px 24px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: small ? "11px" : "13px",
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >
      {children}
    </button>
  );
}

const PRIORITY_COLORS = {
  High: COLORS.danger,
  Medium: COLORS.warning,
  Low: COLORS.primary
};
