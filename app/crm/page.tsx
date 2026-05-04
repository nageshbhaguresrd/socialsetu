'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient, createBrowserClient } from '@lib/supabase/client';
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
  Activity
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
              <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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
                  defaultValue={editingCampaign?.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Client</label>
                  <input
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50 transition-all"
                    placeholder="Raj Restaurant"
                    defaultValue={editingCampaign?.client}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Platform</label>
                  <select
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                    defaultValue={editingCampaign?.platform || 'Meta'}
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
                    defaultValue={editingCampaign?.budget}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                    defaultValue={editingCampaign?.start_date?.split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-text">Status</label>
                <select
                  className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl p-4 text-sm focus:border-primary/50"
                  defaultValue={editingCampaign?.status || 'Active'}
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
                  defaultValue={editingCampaign?.notes}
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
                  onClick={() => handleSaveCampaign({})}
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

export default CampaignsView;


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
