'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from '@/lib/supabase/client';
import { leadSchema } from '@/lib/validation/schemas';
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
  X
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
  Bar
} from 'recharts';

/* ─── TYPES ─────────────────────────────────────────────── */

interface Lead {
  id: string; // Updated from number to string for UUID
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

interface Reminder {
  id: number;
  leadId: string | number; // Accept both for now to fix build
  type: "call" | "followup" | "audit" | "proposal" | "closing";
  note: string;
  dueDate: string;
  dueTime: string;
  done: boolean;
  createdAt: string;
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

const openWhatsApp = (phone: string, msg: string) => {
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
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

/* ─── VIEWS ─────────────────────────────────────────────── */

const DashboardView = ({ leads }: { leads: Lead[] }) => {
  const stats = useMemo(() => {
    const total = leads.reduce((acc, l) => acc + l.value, 0);
    const won = leads.filter(l => l.stage === "Closed Won").reduce((acc, l) => acc + l.value, 0);
    const pipe = leads.filter(l => !["Closed Won", "Closed Lost"].includes(l.stage)).reduce((acc, l) => acc + l.value, 0);
    const active = leads.filter(l => !["Closed Won", "Closed Lost"].includes(l.stage)).length;
    
    // Velocity calculation
    const now = new Date();
    const thisMonthLeads = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthLeads = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).length;

    let velocityVal = "New";
    let velocityColor = COLORS.warning;
    if (lastMonthLeads > 0) {
        const diff = Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100);
        velocityVal = `${diff > 0 ? '+' : ''}${diff}%`;
        velocityColor = diff > 0 ? COLORS.secondary : diff < 0 ? COLORS.danger : COLORS.warning;
    }

    return { total, won, pipe, active, velocityVal, velocityColor };
  }, [leads]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString('en-IN', { month: 'short' });
        
        const monthLeads = leads.filter(l => {
            const ld = new Date(l.createdAt);
            return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear() && l.stage === "Closed Won";
        });
        const val = monthLeads.reduce((acc, l) => acc + l.value, 0);
        data.push({ name: monthLabel, val });
    }
    return data;
  }, [leads]);

  const pieData = INDUSTRIES.map(i => ({
    name: i,
    value: leads.filter(l => l.industry === i).length
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Deals", val: stats.active, sub: "Leads in pipeline", color: COLORS.primary, icon: Trello },
          { label: "Pipeline Value", val: formatCurrency(stats.pipe), sub: `${stats.active} active leads`, color: COLORS.accent, icon: TrendingUp },
          { label: "Won Revenue", val: formatCurrency(stats.won), sub: "Actual billing", color: COLORS.secondary, icon: DollarSign },
          { label: "Lead Velocity", val: stats.velocityVal, sub: "vs last month", color: stats.velocityColor, icon: TrendingUp },
        ].map((s, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={i} className="bg-[#0F0F1A] border border-[#1E1E35] p-5 rounded-2xl relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${s.color}20` }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <span className="text-xs text-text font-medium">{s.label}</span>
              </div>
              <div className="text-2xl font-bold font-poppins">{s.val}</div>
              <div className="text-[10px] text-text/50 mt-1 uppercase tracking-wider">{s.sub}</div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 translate-x-8 -translate-y-8 rounded-full opacity-[0.03]" style={{ background: s.color }} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0F0F1A] border border-[#1E1E35] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-poppins font-bold text-sm">Revenue Forecast</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-text uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Projected</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary" /> Actual</span>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E1E35" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A4A6A', fontSize: 10}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: '#0F0F1A', border: '1px solid #1E1E35', borderRadius: '12px' }} 
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="val" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F0F1A] border border-[#1E1E35] p-6 rounded-2xl">
          <h3 className="font-poppins font-bold text-sm mb-6">Industry Mix</h3>
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-xl font-bold font-poppins">{leads.length}</div>
              <div className="text-[10px] text-text uppercase tracking-widest">Total Leads</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: [COLORS.primary, COLORS.secondary, COLORS.accent][i] }} />
                  <span className="text-text">{d.name}</span>
                </div>
                <span className="font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN CRM COMPONENT ────────────────────────────────── */

export default function BrandBhaaratCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [view, setView] = useState<"dashboard" | "pipeline" | "list" | "reminders">("dashboard");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [waPanel, setWaPanel] = useState<Lead | null>(null);
  const [aiChat, setAiChat] = useState<Lead | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [stageSaved, setStageSaved] = useState(false);
  const [reminderForm, setReminderForm] = useState({
     leadId: '',
     type: 'followup',
     note: '',
     dueDate: '',
     dueTime: '10:00'
  });

  const triggerStageSaved = () => {
    setStageSaved(true);
    setTimeout(() => setStageSaved(false), 2000);
  };

  const fetchLeads = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data.map((l: any) => ({
        id: l.id,
        name: l.name,
        business: l.business,
        city: l.city,
        industry: l.industry,
        budget: l.budget,
        source: l.source,
        stage: l.stage,
        phone: l.phone,
        email: l.email,
        notes: l.notes,
        value: l.value,
        createdAt: l.created_at,
        lastContact: l.last_contact,
        aiScore: l.ai_score,
        priority: l.priority as "High" | "Medium" | "Low"
      })));
    }
    setLoading(false);
  }, []);

  const fetchReminders = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error);
    } else {
      setReminders(data.map((r: any) => ({
        id: r.id,
        leadId: r.lead_id,
        type: r.type,
        note: r.note,
        dueDate: r.due_date,
        dueTime: r.due_time,
        done: r.done,
        createdAt: r.created_at
      })));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // Since loading starts as true, we just wait for both to finish
      await Promise.all([
        fetchLeads(),
        fetchReminders()
      ]);
    };
    init();
  }, [fetchLeads, fetchReminders]);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.business.toLowerCase().includes(search.toLowerCase()) ||
    l.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080812]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080812] text-white font-inter selection:bg-primary selection:text-white">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 border-r border-[#1E1E35] flex flex-col p-6 space-y-8 bg-[#0F0F1A]/50 z-50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Smartphone size={20} className="text-white" />
          </div>
          <div>
            <div className="font-poppins font-extrabold text-lg tracking-tight leading-none">SocialSetu</div>
            <div className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Agency CRM</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "pipeline", label: "Sales Pipeline", icon: Trello },
            { id: "list", label: "Lead Database", icon: List },
            { id: "reminders", label: "Task Center", icon: Bell, alert: reminders.filter(r => !r.done).length },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${view === item.id ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" : "text-text hover:bg-[#1E1E35] hover:text-white"}`}
            >
              <item.icon size={18} className={view === item.id ? "text-white" : "text-text group-hover:text-white transition-colors"} />
              <span className="text-sm">{item.label}</span>
              {item.alert && view !== item.id && (
                <span className="ml-auto bg-danger text-[9px] px-1.5 py-0.5 rounded-full font-bold">{item.alert}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-[#1E1E35]">
          <button 
            onClick={() => setShowAddLead(true)}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-all text-sm"
          >
            <Plus size={18} /> New Lead
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-bottom border-[#1E1E35] flex items-center justify-between px-8 bg-[#080812]/80 backdrop-blur-xl z-40 sticky top-0">
          <div>
            <h2 className="font-poppins font-bold text-xl capitalize">{view.replace("-", " ")}</h2>
            <div className="text-[10px] text-text font-bold uppercase tracking-[0.2em] mt-1 opacity-50">BrandBhaarat Digital 🇮🇳 India</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text group-focus-within:text-white transition-colors" size={16} />
              <input 
                placeholder="Search leads, cities..." 
                className="bg-[#0F0F1A] border border-[#1E1E35] pl-11 pr-4 py-2.5 rounded-xl text-sm w-80 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <button className="relative p-2.5 rounded-xl bg-[#0F0F1A] border border-[#1E1E35] text-text hover:text-white transition-all">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-[#0F0F1A]" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1E1E35] flex items-center justify-center font-bold text-primary border border-primary/20">
                DJ
              </div>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm text-text hover:text-white">Sign out</button>
              </form>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {view === "dashboard" && <DashboardView leads={leads} />}

              {view === "pipeline" && (
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                  {STAGES.map(stage => (
                    <div key={stage} className="min-w-[300px] flex-shrink-0 snap-start">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                          <h4 className="font-poppins font-bold text-xs uppercase tracking-widest">{stage}</h4>
                          <span className="text-[10px] bg-[#1E1E35] text-text px-2 py-0.5 rounded-full font-bold">
                            {filteredLeads.filter(l => l.stage === stage).length}
                          </span>
                        </div>
                        <button className="text-text hover:text-white"><MoreVertical size={16} /></button>
                      </div>

                      <div className="space-y-3">
                        {filteredLeads.filter(l => l.stage === stage).map(lead => (
                          <motion.div
                            whileHover={{ y: -4 }}
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-[#0F0F1A] border border-[#1E1E35] p-5 rounded-2xl cursor-pointer hover:border-primary/40 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <Badge color={PRIORITY_COLORS[lead.priority]}>{lead.priority}</Badge>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={e => { e.stopPropagation(); setWaPanel(lead); }} className="text-[#25D366] hover:scale-110 transition-transform"><Smartphone size={14} /></button>
                                <button onClick={e => { e.stopPropagation(); setAiChat(lead); }} className="text-primary hover:scale-110 transition-transform"><Bot size={14} /></button>
                              </div>
                            </div>
                            <div className="font-poppins font-bold text-sm mb-1 group-hover:text-primary transition-colors">{lead.name}</div>
                            <div className="text-[11px] text-text flex items-center gap-1.5 mb-4">
                              <Briefcase size={10} /> {lead.business}
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-[#1E1E35]">
                              <div className="flex items-center gap-2">
                                <ScoreRing score={lead.aiScore} />
                                <div className="text-[9px] font-bold text-text/50 uppercase">Score</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] font-mono font-bold text-secondary">{formatCurrency(lead.value)}</div>
                                <div className="text-[8px] text-text/40 font-bold uppercase">Value</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === "list" && (
                <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1A1A2E]/50 border-b border-[#1E1E35]">
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest w-12 text-center">Ref</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest">Client & Business</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest">Priority</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest">Stage</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest">Metric</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest text-right">Value</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-text uppercase tracking-widest w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E35]">
                      {filteredLeads.map(l => (
                        <tr 
                          key={l.id} 
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                          onClick={() => setSelectedLead(l)}
                        >
                          <td className="px-6 py-5 text-center font-mono text-[10px] text-text">#{l.id.toString().padStart(3, '0')}</td>
                          <td className="px-6 py-5">
                            <div className="font-poppins font-bold text-xs">{l.name}</div>
                            <div className="text-[10px] text-text mt-1 font-medium">{l.business}</div>
                          </td>
                          <td className="px-6 py-5"><Badge color={PRIORITY_COLORS[l.priority]}>{l.priority}</Badge></td>
                          <td className="px-6 py-5"><Tag color={STAGE_COLORS[l.stage]}>{l.stage}</Tag></td>
                          <td className="px-6 py-5">
                            <div className="text-[10px] text-white/80">{l.phone}</div>
                            <div className="text-[10px] text-text mt-0.5">{l.email}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <ScoreRing score={l.aiScore} />
                              <span className="text-[10px] font-bold uppercase text-text/50">AI Score</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-mono font-bold text-secondary text-xs">{formatCurrency(l.value)}</td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={e => { e.stopPropagation(); setWaPanel(l); }} className="p-1.5 rounded-lg bg-[#25D36620] text-[#25D366] hover:bg-[#25D36640]"><Smartphone size={14} /></button>
                              <button onClick={e => { e.stopPropagation(); setAiChat(l); }} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/40"><Bot size={14} /></button>
                              <button className="p-1.5 rounded-lg bg-[#1E1E35] text-text"><MoreVertical size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeads.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-[#1A1A2E] flex items-center justify-center mb-4 text-text"><Search size={32} /></div>
                      <h4 className="font-bold text-lg mb-1">No matching leads found</h4>
                      <p className="text-text text-sm">Try using different keywords or broadening your search</p>
                    </div>
                  )}
                </div>
              )}
              
              {view === "reminders" && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-poppins">Tasks & Follow-ups</h3>
                      <p className="text-text text-sm mt-1 font-medium italic">Never let a prospect go cold.</p>
                    </div>
                    <Btn onClick={() => {
                      if (leads.length > 0) {
                        setReminderForm(p => ({...p, leadId: leads[0].id}));
                      }
                      setShowReminderModal(true);
                    }} small>+ Add Task</Btn>
                  </div>
                  
                  <div className="space-y-4">
                    {reminders.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(r => {
                      const lead = leads.find(l => l.id === r.leadId);
                      const isOverdue = new Date(r.dueDate) < new Date() && !r.done;
                      return (
                        <div key={r.id} className={`bg-[#0F0F1A] border-[#1E1E35] border p-5 rounded-2xl flex items-center gap-5 group transition-all ${r.done ? "opacity-50" : "hover:border-primary/30"}`}>
                          <button 
                            onClick={async () => {
                              const newDone = !r.done;
                              setReminders(p => p.map(x => x.id === r.id ? {...x, done: newDone} : x));
                              const supabase = createClient();
                              await supabase.from('reminders').update({ done: newDone }).eq('id', r.id);
                            }}
                            className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${r.done ? "bg-secondary border-secondary text-white" : "border-[#1E1E35] group-hover:border-primary/50"}`}
                          >
                            {r.done ? <Check size={18} /> : (isOverdue ? <AlertCircle size={18} className="text-danger" /> : <Clock size={16} className="text-text" />)}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{r.type}</span>
                              <span className="text-[10px] text-text font-bold">Client: {lead?.name}</span>
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isOverdue ? "bg-danger text-white animate-pulse" : "bg-[#1E1E35] text-text"}`}>
                                {r.dueDate}
                              </span>
                            </div>
                            <h4 className={`text-sm font-bold truncate ${r.done ? "line-through text-text" : "text-white"}`}>{r.note}</h4>
                            <div className="flex items-center gap-3 mt-2">
                               <div className="text-[10px] text-text/60 italic">Created {r.createdAt}</div>
                               <button 
                               onClick={async () => {
                                 setReminders(p => p.filter(x => x.id !== r.id));
                                 const supabase = createClient();
                                 await supabase.from('reminders').delete().eq('id', r.id);
                               }}
                                className="text-[10px] text-danger font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 Delete
                               </button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {lead && (
                               <Btn onClick={() => setWaPanel(lead)} outline small color={COLORS.secondary} style={{padding: '6px 12px'}}>
                                 <Smartphone size={14} className="inline mr-1" /> WhatsApp
                               </Btn>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {reminders.length === 0 && (
                       <div className="p-20 text-center border-2 border-dashed border-[#1E1E35] rounded-3xl">
                          <div className="text-4xl mb-4 opacity-20">🎯</div>
                          <h4 className="font-bold text-lg">Inbox Zero!</h4>
                          <p className="text-text text-sm">No pending tasks. Time to hunt for new leads!</p>
                       </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── DRAWERS ── */}
        <AnimatePresence>
          {selectedLead && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedLead(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
              />
              <motion.div 
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-[450px] bg-[#0B0B18] border-l border-[#1E1E35] z-[70] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
              >
                <div className="p-8 border-b border-[#1E1E35] flex items-center justify-between bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                      {selectedLead.name[0]}
                    </div>
                    <div>
                      <h3 className="font-poppins font-bold text-lg">{selectedLead.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-text font-bold uppercase tracking-widest">
                        <MapPin size={10} /> {selectedLead.city}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-[#1E1E35] rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0F0F1A] p-4 rounded-2xl border border-[#1E1E35]">
                      <div className="text-[10px] text-text/50 font-bold uppercase tracking-widest mb-1">AI Intensity</div>
                      <div className="flex items-center gap-3">
                        <ScoreRing score={selectedLead.aiScore} />
                        <span className="text-lg font-bold font-poppins">{selectedLead.aiScore}%</span>
                      </div>
                    </div>
                    <div className="bg-[#0F0F1A] p-4 rounded-2xl border border-[#1E1E35]">
                      <div className="text-[10px] text-text/50 font-bold uppercase tracking-widest mb-1">Contract Value</div>
                      <div className="text-xl font-bold font-mono text-secondary">₹{selectedLead.value.toLocaleString()}</div>
                      <div className="text-[9px] text-text mt-1 uppercase font-bold tracking-tighter">Per Month</div>
                    </div>
                    <div className="col-span-2 bg-[#0F0F1A] p-4 rounded-2xl border border-[#1E1E35]">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-text/50 font-bold uppercase tracking-widest">Update Stage</label>
                        {stageSaved && <span className="text-[10px] text-secondary font-bold">Saved!</span>}
                      </div>
                      <select 
                        value={selectedLead.stage} 
                        onChange={async (e) => {
                            const newStage = e.target.value;
                            setSelectedLead({...selectedLead, stage: newStage});
                            setLeads(prev => prev.map(l => l.id === selectedLead.id ? {...l, stage: newStage} : l));
                            const supabase = createClient();
                            await supabase.from('leads').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', selectedLead.id);
                            triggerStageSaved();
                        }}
                        className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-sm outline-none focus:border-primary/50 text-white"
                      >
                         {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-text uppercase tracking-[0.2em] px-1">Lead Analysis</h4>
                    <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs mb-3">
                        <Bot size={16} /> Gemini AI Prediction
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed font-medium">
                        High intent profile detected in the <span className="text-primary">{selectedLead.industry}</span> sector. 
                        Targeting the <span className="text-primary">{selectedLead.budget}</span> segment allows for a multi-channel growth strategy. 
                        Next logical step is a <span className="underline decoration-primary/40 underline-offset-4 font-bold italic">Discovery Call</span> to confirm budget retention.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[11px] font-bold text-text uppercase tracking-[0.2em] px-1">Engagement History</h4>
                     <div className="space-y-4 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#1E1E35]" />
                        {[
                          { date: "Dec 20", label: "Message Sent", sub: "WhatsApp Proposal Follow-up", icon: Smartphone, color: COLORS.secondary },
                          { date: "Dec 18", label: "Lead Created", sub: "Imported via Meta Leads form", icon: Star, color: COLORS.primary },
                        ].map((h, i) => (
                           <div key={i} className="relative flex gap-6 pl-2">
                             <div className="w-4 h-4 rounded-full border-2 border-bg z-10 mt-1" style={{ background: h.color }} />
                             <div>
                               <div className="text-[10px] text-text font-bold mb-1 opacity-60 uppercase">{h.date}</div>
                               <div className="text-xs font-bold mb-0.5">{h.label}</div>
                               <div className="text-[10px] text-text">{h.sub}</div>
                             </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-text uppercase tracking-[0.2em] px-1">Information Inventory</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { icon: Smartphone, label: "WhatsApp", val: selectedLead.phone },
                        { icon: MessageSquare, label: "Email", val: selectedLead.email },
                        { icon: Briefcase, label: "Industry", val: selectedLead.industry },
                        { icon: MapPin, label: "Town", val: selectedLead.city },
                        { icon: Search, label: "Source", val: selectedLead.source },
                      ].map((item, i) => (
                         <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] text-xs">
                           <div className="flex items-center gap-3 text-text">
                             <item.icon size={14} className="opacity-50" />
                             <span>{item.label}</span>
                           </div>
                           <div className="font-bold">{item.val}</div>
                         </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-[#1E1E35] flex gap-3">
                  <Btn onClick={() => setWaPanel(selectedLead)} color={COLORS.secondary} className="flex-1" style={{padding: '12px 0'}}><Smartphone size={18} className="inline mr-2" /> Message</Btn>
                  <Btn onClick={() => setAiChat(selectedLead)} color={COLORS.primary} className="flex-1" style={{padding: '12px 0'}}><Bot size={18} className="inline mr-2" /> AI Assistant</Btn>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* ── MODALS ── */}
      {waPanel && <WhatsAppPanel lead={waPanel} onClose={() => setWaPanel(null)} />}
      {aiChat && <AIChat lead={aiChat} onClose={() => setAiChat(null)} />}
      {showAddLead && (
        <LeadModal 
          onClose={() => setShowAddLead(false)} 
          onSave={async (f: any) => { 
            const supabase = createClient();
            await supabase.from('leads').insert({
              name: f.name,
              business: f.business,
              city: f.city,
              industry: f.industry,
              budget: f.budget,
              source: f.source,
              stage: f.stage,
              phone: f.phone,
              email: f.email,
              value: f.value,
              notes: f.notes || '',
              ai_score: f.aiScore || 70,
              priority: f.priority || 'Medium'
            });
            setShowAddLead(false);
            fetchLeads();
          }} 
        />
      )}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6">
           <div className="bg-[#0B0B18] border border-[#1E1E35] rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h3 className="text-xl font-bold font-poppins mb-6">Create Follow-up</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] text-text font-bold uppercase mb-2 block">Prospect</label>
                    <select 
                      value={reminderForm.leadId} 
                      onChange={e => setReminderForm(p => ({...p, leadId: e.target.value}))}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                       <option value="">Select a prospect</option>
                       {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.business})</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] text-text font-bold uppercase mb-2 block">Action Type</label>
                    <div className="grid grid-cols-2 gap-2">
                       {REMINDER_TYPES.map(t => (
                         <button 
                            key={t.id} 
                            onClick={e => setReminderForm(p => ({...p, type: t.id as any}))}
                            className={`p-3 rounded-xl border transition-all ${reminderForm.type === t.id ? "bg-primary border-primary text-white" : "border-[#2A2A45] bg-[#1A1A2E] text-xs font-bold hover:bg-primary/10 hover:border-primary"}`}
                          >
                           {t.label}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] text-text font-bold uppercase mb-2 block">Due Date</label>
                    <input type="date" value={reminderForm.dueDate} 
                      onChange={e => setReminderForm(p => ({...p, dueDate: e.target.value}))}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                 </div>
                 <div>
                    <label className="text-[10px] text-text font-bold uppercase mb-2 block">Reminder Note</label>
                    <textarea 
                      value={reminderForm.note}
                      onChange={e => setReminderForm(p => ({...p, note: e.target.value}))}
                      placeholder="e.g. Discuss the retainer increase..." className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-sm h-24 outline-none focus:ring-2 focus:ring-primary/20" />
                 </div>
                 <div className="flex gap-4 p-4">
                    <button className="flex-1 py-3 font-bold text-text hover:text-white" onClick={() => setShowReminderModal(false)}>Discard</button>
                    <Btn className="flex-1" onClick={async () => {
                       if (!reminderForm.leadId || !reminderForm.note || !reminderForm.dueDate) {
                         alert("Please fill all required fields");
                         return;
                       }
                       const supabase = createClient();
                       const { error } = await supabase.from('reminders').insert({
                         lead_id: reminderForm.leadId,
                         type: reminderForm.type,
                         note: reminderForm.note,
                         due_date: reminderForm.dueDate,
                         due_time: reminderForm.dueTime,
                         done: false,
                         created_at: new Date().toISOString()
                       });
                       if (error) {
                         alert("Failed to save reminder, please try again");
                       } else {
                         setShowReminderModal(false);
                         setReminderForm({ leadId: '', type: 'followup', note: '', dueDate: '', dueTime: '10:00' });
                         fetchReminders();
                       }
                    }}>Set Reminder</Btn>
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
      `}</style>
    </div>
  );
}

/* ─── HELPER COMPONENTS ─── */

function Tag({ children, color = "#3B82F6" }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${color}20`, color }}>{children}</span>;
}

function Btn({ children, onClick, color = "#FF6B35", outline = false, small = false, disabled = false, style = {}, className = "" }: any) {
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

function WhatsAppPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [selected, setSelected] = useState(WA_TEMPLATES[0]);
  const [msg, setMsg] = useState(WA_TEMPLATES[0].template(lead));
  const [loading, setLoading] = useState(false);

  const genAI = async () => {
    setLoading(true);
    try {
      const prompt = `Write a professional WhatsApp message for ${lead.name} from ${lead.business}. Topic: ${selected.label}. Use *bold* for key terms. Hinglish tone. Social media marketing focus for BrandBhaarat Digital.`;
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setMsg(data.text);
    } catch (e) {
      console.error(e);
      setMsg("Error generating message. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0B0B18] border border-[#25D366]/20 rounded-3xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(37,211,102,0.1)]">
        <div className="p-6 border-b border-[#1E1E35] flex items-center justify-between bg-gradient-to-r from-[#25D366]/5 to-transparent">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white"><Smartphone size={20} /></div>
             <div>
                <h3 className="font-bold font-poppins">WhatsApp Campaign Center</h3>
                <p className="text-[10px] text-[#25D366] font-bold uppercase tracking-widest mt-0.5">Campaign Mode · Active</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1E1E35] rounded-xl transition-all"><X size={20} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
           <div className="w-64 border-r border-[#1E1E35] p-4 space-y-2 overflow-y-auto custom-scrollbar bg-black/20">
              <div className="text-[9px] text-text/50 font-bold uppercase tracking-widest px-2 mb-4">Templates Library</div>
              {WA_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setSelected(t); setMsg(t.template(lead)); }}
                  className={`w-full text-left p-3 rounded-2xl transition-all ${selected.id === t.id ? "bg-[#25D366]/10 border border-[#25D366]/30 text-white" : "text-text hover:bg-[#1E1E35]"}`}
                >
                  <div className="text-xs font-bold flex items-center gap-2">{t.icon} {t.label}</div>
                  <div className="text-[9px] mt-1 opacity-50 truncate">{t.template(lead).substring(0, 40)}...</div>
                </button>
              ))}
           </div>
           <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              <div className="flex gap-4">
                 <button onClick={genAI} disabled={loading} className="flex-1 py-4 rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                    <Bot size={18} className="inline mr-2" /> {loading ? "Crafting Message..." : "AI Personalize Content"}
                 </button>
                 <button onClick={() => openWhatsApp(lead.phone, msg)} className="flex-1 py-4 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <Smartphone size={18} /> Launch WhatsApp
                 </button>
              </div>
              
              <div className="flex-1 bg-[#1A1A2E]/50 border border-[#2A2A45] rounded-3xl p-8 relative">
                 <div className="absolute top-4 left-6 text-[9px] font-bold text-text uppercase tracking-widest opacity-30">Live Draft Editor</div>
                 <textarea 
                  value={msg} 
                  onChange={e => setMsg(e.target.value)}
                  className="w-full h-full bg-transparent resize-none border-none outline-none font-mono text-sm leading-relaxed text-white/90"
                 />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1A1A2E] rounded-2xl border border-[#2A2A45]">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#1E1E35] flex items-center justify-center text-[#25D366]"><Smartphone size={14} /></div>
                   <div className="text-[10px] text-text font-bold uppercase">Destination Phone: <span className="text-white">+91 {lead.phone}</span></div>
                 </div>
                 <div className="text-[10px] text-text italic">Character count: {msg.length}</div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

const suggestPriority = (lead: Lead): "High" | "Medium" | "Low" => {
  if (lead.aiScore >= 80) return "High";
  if (lead.aiScore >= 60) return "Medium";
  return "Low";
};

function AIChat({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const suggestedPriority = suggestPriority(lead);
  const [messages, setMessages] = useState<any[]>([{ role: "assistant", content: `Analysis complete for **${lead.name}**.\n\nI recommend a **${lead.industry} specialized audit** focusing on regional Hindi/English hybrid content.\n\nMy priority suggestion for this lead is: **${suggestedPriority}**.\n\nHow should we tackle this **${lead.budget}** prospect?` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const m = input; setInput("");
    setMessages(prev => [...prev, { role: "user", content: m }]);
    setLoading(true);
    try {
      const context = `Lead: ${lead.name}, Business: ${lead.business}, Stage: ${lead.stage}, Value: ${lead.value}, AI Score: ${lead.aiScore}. Suggested Priority: ${suggestedPriority}. Instructions: Professional Indian Agency Sales Assistant.`;
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: m, systemInstruction: context }),
      });
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "AI link unstable. Check configuration." }]); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 backdrop-blur-md">
       <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0B0B18] border border-primary/20 rounded-3xl w-full max-w-lg h-[650px] flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-[#1E1E35] flex items-center justify-between bg-gradient-to-br from-primary/10 to-transparent text-primary">
             <div className="flex items-center gap-3">
                <Bot size={24} />
                <div>
                   <h3 className="font-bold font-poppins">Sales Intelligence Assistant</h3>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-text opacity-70">Focus: {lead.name}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-[#1E1E35] rounded-xl transition-all text-text"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-[#1A1A32] text-white/90 border border-[#2A2A45] rounded-tl-none"}`}>
                      {m.content}
                   </div>
                </div>
             ))}
             {loading && (
                <div className="flex items-center gap-2 p-4 bg-[#1A1A32] rounded-2xl w-fit animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                   <div className="w-1.5 h-1.5 rounded-full bg-primary transition-all delay-100" />
                   <div className="w-1.5 h-1.5 rounded-full bg-primary transition-all delay-200" />
                </div>
             )}
             <div ref={scrollRef} />
          </div>
          <div className="p-6 border-t border-[#1E1E35] flex gap-3 bg-[#080812]">
             <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && onSend()}
              placeholder="Ask for strategy, script, or objection handling..." 
              className="flex-1 bg-[#1A1A2E] border border-[#2A2A45] rounded-xl px-4 text-xs text-white outline-none focus:border-primary/50 transition-all font-medium"
             />
             <Btn onClick={onSend} disabled={loading} small className="px-6">Ask AI</Btn>
          </div>
       </motion.div>
    </div>
  );
}

function LeadModal({ onClose, onSave }: any) {
  const [f, setF] = useState({ name: "", business: "", city: "Mumbai", industry: "Restaurant/Food", budget: "₹10K–₹30K", source: "Meta Ads", stage: "New Lead", priority: "Medium", phone: "", email: "", value: 15000, aiScore: 70 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: any) => {
    setF(p => ({ ...p, [k]: v }));
    setFormErrors(p => ({ ...p, [k]: "" }));
  };

  const handleSave = () => {
    const result = leadSchema.safeParse(f);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(e => {
        if (e.path[0]) {
          errors[e.path[0] as string] = e.message;
        }
      });
      setFormErrors(errors);
      return;
    }
    onSave(f);
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
       <div className="bg-[#0B0B18] border border-[#1E1E35] rounded-[32px] w-full max-w-2xl p-10 overflow-auto max-h-[90vh] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-2xl font-bold font-poppins">Onboard New Prospect</h3>
             <button onClick={onClose} className="p-2 hover:bg-[#1A1A2E] rounded-xl transition-all"><X size={24}/></button>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] text-text font-bold uppercase tracking-widest ml-1">Business Identity</label>
                <input placeholder="Legal Business Name" value={f.business} onChange={e => upd("business", e.target.value)} className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-2xl p-4 text-sm outline-none focus:border-primary/50 transition-all" />
                {formErrors.business && <p className="text-[11px] text-red-400">{formErrors.business}</p>}
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-text font-bold uppercase tracking-widest ml-1">Point of Contact</label>
                <input placeholder="Full Name" value={f.name} onChange={e => upd("name", e.target.value)} className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-2xl p-4 text-sm outline-none focus:border-primary/50 transition-all" />
                {formErrors.name && <p className="text-[11px] text-red-400">{formErrors.name}</p>}
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-text font-bold uppercase tracking-widest ml-1">WhatsApp (+91)</label>
                <input placeholder="10-digit Mobile" value={f.phone} onChange={e => upd("phone", e.target.value)} className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-2xl p-4 text-sm outline-none focus:border-primary/50 transition-all" />
                {formErrors.phone && <p className="text-[11px] text-red-400">{formErrors.phone}</p>}
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-text font-bold uppercase tracking-widest ml-1">City Location</label>
                <select value={f.city} onChange={e => upd("city", e.target.value)} className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-2xl p-4 text-sm outline-none focus:border-primary/50 transition-all">
                   {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
                {formErrors.city && <p className="text-[11px] text-red-400">{formErrors.city}</p>}
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-text font-bold uppercase tracking-widest ml-1">Project Value</label>
                <input type="number" value={f.value} onChange={e => upd("value", Number(e.target.value))} className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-2xl p-4 text-sm outline-none focus:border-primary/50 transition-all" />
                {formErrors.value && <p className="text-[11px] text-red-400">{formErrors.value}</p>}
             </div>
             <div className="col-span-2 flex gap-4 mt-8">
                <button className="flex-1 py-4 font-bold text-text hover:text-white transition-all" onClick={onClose}>Cancel</button>
                <Btn onClick={handleSave} className="flex-[2] py-4 rounded-2xl">Initialize Onboarding</Btn>
             </div>
          </div>
       </div>
    </div>
  );
}

const WA_TEMPLATES = [
  { id: "intro", label: "🤝 First Introduction", icon: "👋", template: (l: Lead) => `Hi ${l.name}! 👋\n\nI'm from *SocialSetu Digital* 🇮🇳\n\nWe specialize in ${l.industry} growth within ${l.city}.\n\nSaw your interest in scaling *${l.business}*. I'd love to offer a *FREE Social Media Map* — just to show you how we work.\n\nReady? Just reply *YES*! 🚀` },
  { id: "audit", label: "📊 Audit Results", icon: "📈", template: (l: Lead) => `Hey ${l.name}! 🙏\n\nYour *Social Audit* for *${l.business}* is ready.\n\nFound 3 gaps in your ${l.city} local targeting. We fix these = easy 2x growth.\n\nCan we hop on a 10-min call at 4 PM to discuss?` },
  { id: "proposal", label: "💼 Commercials", icon: "💰", template: (l: Lead) => `Hi ${l.name}. Hope you're well!\n\nAttaching the customized *BrandBhaarat Plan* for *${l.business}*.\n\nIncludes:\n✅ Daily Regional Reels\n✅ Managed WhatsApp Funnel\n✅ High-ROAS Meta Ads\n\nLooking at start date on Monday. Thoughts? 🙏` },
  { id: "followup", label: "⏰ Nudge", icon: "🔔", template: (l: Lead) => `Hey ${l.name}! 😊\n\nQuick nudge regarding the *SocialSetu Plan*.\n\nWe have valid capacity for *1 new client onboarding* this week. Would love ${l.business} to be the one! 🚀\n\nShall we proceed?` },
];

const PRIORITY_COLORS = {
  High: COLORS.danger,
  Medium: COLORS.warning,
  Low: COLORS.primary
};
