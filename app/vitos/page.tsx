'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  Crown,
  LayoutDashboard,
  Terminal,
  Users,
  Building2,
  Briefcase,
  FolderKanban,
  CheckSquare,
  Code2,
  Cpu,
  Server,
  Share2,
  Megaphone,
  Headphones,
  DollarSign,
  BookOpen,
  Plug,
  FileText,
  Settings,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Search,
  Sparkles,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Plus,
  Play,
  Eye,
  Check,
  X,
  Database,
  Lock,
  Globe,
  Radio,
  FileCode,
  Zap,
} from 'lucide-react';
import { AI_EMPLOYEES_REGISTRY, AI_DEPARTMENTS } from '@/lib/ai/vitos-registry';
import {
  AITask,
  ApprovalCheckpoint,
  ReverseEngineeringAudit,
  DevOpsServer,
  ITProject,
  ITSupportTicket,
  ITInvoice,
  ITQuotation,
  DepartmentKey,
} from '@/lib/types/ai-vitos';

type NavSection =
  | 'dashboard'
  | 'command'
  | 'employees'
  | 'departments'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'studio'
  | 'reveng'
  | 'devops'
  | 'marketing'
  | 'social'
  | 'support'
  | 'finance'
  | 'knowledge'
  | 'integrations'
  | 'reports'
  | 'settings';

const INITIAL_APPROVALS: ApprovalCheckpoint[] = [
  {
    id: 'appr-01',
    title: 'Deploy Next.js 15 E-Commerce Frontend to Production',
    action_type: 'deploy_production',
    autonomy_level: 'L2',
    status: 'pending',
    proposed_by_agent_id: 'deployment-agent',
    action_payload: { environment: 'production', cluster: 'AWS ap-south-1', branch: 'main' },
    created_at: '2026-11-20T10:30:00.000Z',
  },
  {
    id: 'appr-02',
    title: 'Dispatch Commercial SOW & Quotation (₹1,85,000) to Acme Corp',
    action_type: 'send_proposal',
    autonomy_level: 'L2',
    status: 'pending',
    proposed_by_agent_id: 'proposal-generator',
    action_payload: { client: 'Acme Corp', amount: 185000, deliverables: 'Custom CRM Platform' },
    created_at: '2026-11-20T10:15:00.000Z',
  },
];

const INITIAL_TASKS: AITask[] = [
  {
    id: 'task-101',
    client_id: 'c-1',
    client_name: 'Apex Global Logistics',
    task_title: 'Synthesize Cleanroom Architecture for Tracking Portal',
    department_key: 'reveng',
    assigned_agent_id: 'cleanroom-planner',
    agent_name: 'Sterling Archer',
    agent_role: 'Cleanroom Original Architecture Planner',
    priority: 'High',
    status: 'in_progress',
    autonomy_level: 'L1',
    tokens_used: 14200,
    cost_usd: 0.028,
    created_at: '2026-11-20T09:00:00.000Z',
    updated_at: '2026-11-20T09:30:00.000Z',
  },
  {
    id: 'task-102',
    client_id: 'c-2',
    client_name: 'Nova D2C Brands',
    task_title: 'Draft 30-Day Multi-Platform Social Media Strategy',
    department_key: 'marketing',
    assigned_agent_id: 'social-manager',
    agent_name: 'Zoe Hart',
    agent_role: 'Social Media Management Agent',
    priority: 'Medium',
    status: 'completed',
    autonomy_level: 'L1',
    tokens_used: 8900,
    cost_usd: 0.017,
    created_at: '2026-11-20T08:30:00.000Z',
    updated_at: '2026-11-20T09:15:00.000Z',
  },
  {
    id: 'task-103',
    client_id: 'c-3',
    client_name: 'FinFlow Technologies',
    task_title: 'Execute OWASP Security Audit and Hardening',
    department_key: 'devops',
    assigned_agent_id: 'security-sentinel',
    agent_name: 'Cyra Vance',
    agent_role: 'Cybersecurity & Compliance Sentinel',
    priority: 'Urgent',
    status: 'in_progress',
    autonomy_level: 'L1',
    tokens_used: 19400,
    cost_usd: 0.038,
    created_at: '2026-11-20T07:45:00.000Z',
    updated_at: '2026-11-20T08:20:00.000Z',
  },
  {
    id: 'task-104',
    client_id: 'c-4',
    client_name: 'MediCare Hub',
    task_title: 'Generate Normalized Postgres Schema with Tenant RLS',
    department_key: 'webdev',
    assigned_agent_id: 'db-architect',
    agent_name: 'Priya Sundaram',
    agent_role: 'Database Architect (PostgreSQL)',
    priority: 'High',
    status: 'completed',
    autonomy_level: 'L1',
    tokens_used: 11200,
    cost_usd: 0.022,
    created_at: '2026-11-20T06:30:00.000Z',
    updated_at: '2026-11-20T07:15:00.000Z',
  },
];

const INITIAL_DEVOPS_SERVER: DevOpsServer = {
  id: 'srv-01',
  client_id: 'c-core',
  server_name: 'Production Edge Node (Mumbai - AWS)',
  host_url: 'https://socialsetu.com',
  ip_address: '76.76.21.21',
  environment: 'production',
  status: 'healthy',
  ssl_valid: true,
  ssl_expiry_date: '2027-04-15',
  last_ping_ms: 38,
  uptime_percentage: 99.98,
  monitoring_enabled: true,
  last_checked_at: '2026-11-20T11:00:00.000Z',
  created_at: '2026-10-01T00:00:00.000Z',
};

export default function AIVirtualITCompanyOSPage() {
  const [activeTab, setActiveTab] = useState<NavSection>('command');
  const [commandInput, setCommandInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [commandResult, setCommandResult] = useState<any>(null);

  // Stats state
  const [activeAgentsCount, setActiveAgentsCount] = useState(42);
  const [runningTasksCount, setRunningTasksCount] = useState(6);
  const [completedTasksCount, setCompletedTasksCount] = useState(148);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(2);
  const [totalRevenue, setTotalRevenue] = useState(42850);
  const [totalCost, setTotalCost] = useState(128.45);
  const [tokenConsumption, setTokenConsumption] = useState(1894200);

  // Approvals State
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalCheckpoint[]>(INITIAL_APPROVALS);

  // Tasks State
  const [tasks, setTasks] = useState<AITask[]>(INITIAL_TASKS);

  // Reverse Engineering State
  const [revengUrl, setRevengUrl] = useState('https://linear.app');
  const [revengLoading, setRevengLoading] = useState(false);
  const [revengAudit, setRevengAudit] = useState<ReverseEngineeringAudit | null>(null);

  // DevOps State
  const [devopsHost, setDevopsHost] = useState('https://socialsetu.com');
  const [devopsLoading, setDevopsLoading] = useState(false);
  const [devopsServer, setDevopsServer] = useState<DevOpsServer | null>(INITIAL_DEVOPS_SERVER);
  const [securityScanResult, setSecurityScanResult] = useState<any>(null);

  // Filter Agents
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchAgentQuery, setSearchAgentQuery] = useState('');

  // Daily Report State
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Execute Founder Natural Language Command
  const handleExecuteCommand = async (cmdText?: string) => {
    const textToRun = cmdText || commandInput;
    if (!textToRun.trim()) return;

    setIsProcessingCommand(true);
    setCommandResult(null);

    try {
      const res = await fetch('/api/vitos/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: textToRun,
          clientId: 'client-apex-01',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCommandResult(data.data);
        if (data.data.tasksCreated && data.data.tasksCreated.length > 0) {
          setTasks((prev) => [...data.data.tasksCreated, ...prev]);
          setRunningTasksCount((prev) => prev + data.data.tasksCreated.length);
        }
        if (data.data.approvalsRequired && data.data.approvalsRequired.length > 0) {
          setPendingApprovals((prev) => [...data.data.approvalsRequired, ...prev]);
          setPendingApprovalsCount((prev) => prev + data.data.approvalsRequired.length);
        }
        setTokenConsumption((prev) => prev + (data.data.tokensConsumed || 1200));
        setTotalCost((prev) => Number((prev + (data.data.costUsd || 0.01)).toFixed(4)));
      }
    } catch (err) {
      console.error('Failed to run command:', err);
    } finally {
      setIsProcessingCommand(false);
    }
  };

  // Run Reverse Engineering Audit
  const handleRunRevEng = async () => {
    if (!revengUrl.trim()) return;
    setRevengLoading(true);
    try {
      const res = await fetch('/api/vitos/reveng', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: revengUrl,
          category: 'Competitor SaaS Product',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRevengAudit(data.data);
      }
    } catch (e) {
      console.error('RevEng audit error:', e);
    } finally {
      setRevengLoading(false);
    }
  };

  // Run DevOps Health Ping
  const handleRunDevOpsCheck = async (action: 'ping' | 'security' = 'ping') => {
    setDevopsLoading(true);
    try {
      const res = await fetch('/api/vitos/devops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'security' ? 'security_scan' : 'ping',
          hostUrl: devopsHost,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (action === 'security') {
          setSecurityScanResult(data.data);
        } else {
          setDevopsServer(data.data);
        }
      }
    } catch (e) {
      console.error('DevOps check error:', e);
    } finally {
      setDevopsLoading(false);
    }
  };

  // Approve Checkpoint
  const handleApproveCheckpoint = (id: string) => {
    setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
    setPendingApprovalsCount((prev) => Math.max(0, prev - 1));
    setCompletedTasksCount((prev) => prev + 1);
  };

  // Reject Checkpoint
  const handleRejectCheckpoint = (id: string) => {
    setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
    setPendingApprovalsCount((prev) => Math.max(0, prev - 1));
  };

  // Filtered AI Employees
  const filteredEmployees = AI_EMPLOYEES_REGISTRY.filter((emp) => {
    const matchDept = selectedDeptFilter === 'all' || emp.department_key === selectedDeptFilter;
    const matchSearch =
      emp.name.toLowerCase().includes(searchAgentQuery.toLowerCase()) ||
      emp.role_title.toLowerCase().includes(searchAgentQuery.toLowerCase()) ||
      emp.agent_id.toLowerCase().includes(searchAgentQuery.toLowerCase()) ||
      emp.capabilities.some((c) => c.toLowerCase().includes(searchAgentQuery.toLowerCase()));
    return matchDept && matchSearch;
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'command', label: 'AI Command Centre', icon: Terminal, badge: 'CEO' },
    { id: 'employees', label: 'AI Employees (42)', icon: Users },
    { id: 'departments', label: 'Departments (8)', icon: Building2 },
    { id: 'clients', label: 'Clients & Workspaces', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'tasks', label: 'Tasks & Kanban', icon: CheckSquare, badge: runningTasksCount > 0 ? `${runningTasksCount}` : undefined },
    { id: 'studio', label: 'Development Studio', icon: Code2 },
    { id: 'reveng', label: 'Reverse Engineering Lab', icon: Cpu, badge: 'Intel' },
    { id: 'devops', label: 'IT Operations & SRE', icon: Server },
    { id: 'marketing', label: 'Digital Marketing', icon: Megaphone },
    { id: 'social', label: 'Social Media Management', icon: Share2 },
    { id: 'support', label: 'Customer Support', icon: Headphones },
    { id: 'finance', label: 'Finance & Billing', icon: DollarSign },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'integrations', label: 'Integrations & Tools', icon: Plug },
    { id: 'reports', label: 'Executive Reports', icon: FileText },
    { id: 'settings', label: 'Autonomy Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Founder Operational Ribbon */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">AI Virtual IT Company OS</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                v3.0 ENTERPRISE
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AUTONOMOUS (8 DEPARTMENTS ACTIVE)
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Chief Executive Officer: Victoria Vance | Multi-Tenant Architecture
            </p>
          </div>
        </div>

        {/* Global Live Metrics */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Revenue YTD</span>
            <span className="font-bold text-emerald-400">₹{(totalRevenue * 83).toLocaleString('en-IN')} ($42.8K)</span>
          </div>
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">SLA Uptime</span>
            <span className="font-bold text-cyan-400">99.98% Healthy</span>
          </div>
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">AI Compute Cost</span>
            <span className="font-bold text-amber-400">${totalCost.toFixed(2)} USD</span>
          </div>

          {/* Pending Approvals Button */}
          {pendingApprovalsCount > 0 && (
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-xs hover:bg-amber-500/30 transition-colors animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{pendingApprovalsCount} Approval{pendingApprovalsCount > 1 ? 's' : ''} Needed</span>
            </button>
          )}

          <Link
            href="/vitos/portal"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Client Portal</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <span>Exit to Website</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* 18-Section Left Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              <span>Corporate OS Navigation</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">18 Modules</span>
            </div>
          </div>

          <nav className="p-2 space-y-0.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavSection)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Autonomy Level Indicator Card */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 m-2 rounded-xl border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300">Autonomy Protocol</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3 h-3" /> Level 1: Fully Autonomous (Read/Plan/Code)
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <ShieldAlert className="w-3 h-3" /> Level 2: Approval Gate (Deploy/Ads)
              </div>
              <div className="flex items-center gap-1 text-rose-400">
                <Lock className="w-3 h-3" /> Level 3: Strict Restricted (Prod/Drop)
              </div>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-6 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: AI COMMAND CENTRE (PRIMARY FOUNDER INTERFACE) */}
          {/* ============================================================== */}
          {activeTab === 'command' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none"></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h1 className="text-xl font-extrabold text-white tracking-tight">Central AI Command Centre</h1>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        CEO Victoria Vance
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                      Issue executive instructions in natural language. Victoria Vance decomposes high-level business goals into ordered multi-agent subtasks, coordinates departments, and enforces the 3 Autonomy Levels.
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-400">Model Engine</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono font-semibold text-indigo-300 border border-slate-700">
                      Gemini 3.8 Flash (Multi-Agent Fast)
                    </span>
                  </div>
                </div>

                {/* Natural Language Command Bar */}
                <div className="mt-6">
                  <div className="relative">
                    <textarea
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      placeholder='Type executive instruction... (e.g. "Find 20 potential businesses that need website development" or "Analyse competitor linear.app and prepare cleanroom architecture")'
                      rows={3}
                      className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-inner"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleExecuteCommand();
                        }
                      }}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">Ctrl+Enter to Run</span>
                      <button
                        onClick={() => handleExecuteCommand()}
                        disabled={isProcessingCommand || !commandInput.trim()}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isProcessingCommand ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Orchestrating...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Execute Instruction</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick One-Click Executive Prompts */}
                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <span className="text-xs font-semibold text-slate-400 block mb-2">Preset Founder Directives:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Find 20 potential businesses that need website development',
                      'Analyse competitor linear.app and prepare cleanroom architecture',
                      'Create a professional website and CMS for client Nova Retail',
                      'Check all client websites and identify any latency or downtime',
                      'Generate social media posts and visuals for the next 30 days',
                      'Prepare today’s executive company performance report',
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCommandInput(prompt);
                          handleExecuteCommand(prompt);
                        }}
                        className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                      >
                        &ldquo;{prompt}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Execution Results View */}
              {commandResult && (
                <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-base font-bold text-white">CEO Task Orchestration Plan Generated</h2>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {commandResult.status === 'waiting_approval' ? 'Waiting Level 2 Founder Approval' : 'Execution Enforced'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                    {commandResult.summary}
                  </p>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Decomposed Subtask Pipeline ({commandResult.plan.steps.length} Steps)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {commandResult.plan.steps.map((step: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
                            {step.step}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-white">{step.action}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  step.autonomy === 'L1'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {step.autonomy === 'L1' ? 'L1: Autonomous' : 'L2: Approval Gate'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">{step.description}</p>
                            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                              <span>Assigned Agent: <strong className="text-indigo-300">{step.agent_id}</strong></span>
                              <span>•</span>
                              <span>Dept: <strong className="text-slate-400 capitalize">{step.department}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {commandResult.approvalsRequired.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Action Required: Founder Approval Checkpoint</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        The CEO Agent has placed {commandResult.approvalsRequired.length} action(s) in the Level 2 approval gate.
                        No production commits or public communications will fire until you authorize them.
                      </p>
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <span>Review Pending Approvals in Tasks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Department Status Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    8 AI Departments Real-Time Status
                  </h2>
                  <button
                    onClick={() => setActiveTab('departments')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <span>View All Departments</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AI_DEPARTMENTS.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => {
                        setSelectedDeptFilter(dept.department_key);
                        setActiveTab('employees');
                      }}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{dept.name.split('&')[0]}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Lead: <strong className="text-slate-300">{dept.lead_agent_id.split('-')[0]}</strong></span>
                        <span className="text-indigo-400 font-semibold">{dept.active_agents_count} Agents</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: AI EMPLOYEES (42 AGENTS DIRECTORY) */}
          {/* ============================================================== */}
          {activeTab === 'employees' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>AI Employee Roster ({AI_EMPLOYEES_REGISTRY.length} Autonomous Agents)</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Each employee possesses specialized system instructions, tools, permission levels, and individual token accounting.
                  </p>
                </div>

                {/* Search and Dept Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search agent or skill..."
                      value={searchAgentQuery}
                      onChange={(e) => setSearchAgentQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 w-48"
                    />
                  </div>
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Departments (8)</option>
                    <option value="executive">Executive</option>
                    <option value="bizdev">BizDev & Sales</option>
                    <option value="webdev">Web & App Dev</option>
                    <option value="reveng">Reverse Engineering</option>
                    <option value="devops">IT Ops & DevOps</option>
                    <option value="marketing">Digital Marketing</option>
                    <option value="support">Customer Support</option>
                    <option value="finance">Finance & Billing</option>
                  </select>
                </div>
              </div>

              {/* Employee Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-indigo-400">
                            {agent.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white leading-tight">{agent.name}</h3>
                            <span className="text-[11px] text-slate-400 font-medium block">{agent.role_title}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            agent.autonomy_level === 'L1'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {agent.autonomy_level}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        {agent.system_prompt}
                      </p>

                      {/* Capabilities pills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {agent.capabilities.slice(0, 3).map((cap, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Rate: <strong className="text-white">${agent.hourly_rate}/hr</strong></span>
                      <span>Score: <strong className="text-emerald-400">{agent.performance_score}%</strong></span>
                      <span>Done: <strong className="text-indigo-400">{agent.tasks_completed}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: REVERSE ENGINEERING LAB (ETHICAL ANALYSIS) */}
          {/* ============================================================== */}
          {activeTab === 'reveng' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Reverse Engineering & Intelligence Lab
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ETHICAL & LEGAL COMPLIANT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Analyzes publicly observable DOM, headers, and UI components of competitor websites to formulate 100% original, cleanroom architectures. Zero authentication bypass, DRM tampering, or copyrighted source copying.
                </p>
              </div>

              {/* URL Inspection Input */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">Target Public Website / Competitor Domain:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={revengUrl}
                    onChange={(e) => setRevengUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleRunRevEng}
                    disabled={revengLoading || !revengUrl}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {revengLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Inspecting DOM & APIs...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Run Cleanroom Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Audit Findings Display */}
              {revengAudit && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-sm text-white">{revengAudit.target_name} ({revengAudit.target_url})</h2>
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Ethical Compliance Certified: 100% Public Asset Analysis
                      </span>
                    </div>
                    <span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded text-slate-300 border border-slate-700">
                      Lead Agent: Sterling Archer (cleanroom-planner)
                    </span>
                  </div>

                  {/* 3-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tech Stack Detected */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4" /> Tech Stack Fingerprinted
                      </h3>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Frontend:</span>
                          <span className="font-semibold">{revengAudit.tech_stack.frontend?.join(', ') || 'Next.js 15, React 19'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">CSS System:</span>
                          <span className="font-semibold">{revengAudit.tech_stack.css_frameworks?.join(', ') || 'Tailwind CSS 4'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Backend Indicators:</span>
                          <span className="font-semibold">{revengAudit.tech_stack.backend_indicators?.join(', ') || 'Node.js, PostgreSQL'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">CDN / Host:</span>
                          <span className="font-semibold">{revengAudit.tech_stack.fonts_and_cdns?.join(', ') || 'Cloudflare Edge CDN'}</span>
                        </div>
                      </div>
                    </div>

                    {/* DOM Structure */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Radio className="w-4 h-4" /> Public DOM & Navigation
                      </h3>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Page Title:</span>
                          <span className="font-semibold line-clamp-1">{revengAudit.dom_structure.title}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Detected Nav Items:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {revengAudit.dom_structure.navigation_items?.map((item, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Identified Sections:</span>
                          <span className="font-semibold">{revengAudit.dom_structure.sections_detected?.join(' → ') || 'Hero → Bento → Pricing'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Public APIs Observed */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Plug className="w-4 h-4" /> Public Endpoints
                      </h3>
                      <div className="space-y-2 text-xs">
                        {revengAudit.public_apis.map((api, i) => (
                          <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px]">
                            <div className="flex items-center justify-between text-indigo-400 font-bold">
                              <span>{api.method} {api.endpoint}</span>
                              <span className="text-[9px] text-slate-400">{api.auth_requirement}</span>
                            </div>
                            <p className="text-slate-400 text-[10px] mt-0.5">{api.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cleanroom Implementation Recommendation */}
                  <div className="p-5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Original Cleanroom Architecture Blueprint (Non-Infringing)</span>
                    </h3>
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {revengAudit.cleanroom_architecture_recommendation}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Estimated Sprint: <strong>{revengAudit.original_implementation_plan.estimated_sprint_weeks} Weeks</strong>
                      </span>
                      <button
                        onClick={() => {
                          handleExecuteCommand(`Build original cleanroom website based on ${revengAudit.target_name} audit`);
                          setActiveTab('command');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Commission Project in Development Studio</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: IT OPERATIONS & DEVOPS (SRE & HEALTH CHECK) */}
          {/* ============================================================== */}
          {activeTab === 'devops' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" />
                    <span>IT Operations, SRE & Cloud DevOps</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    24/7 autonomous uptime monitoring, SSL certificate tracking, latency telemetry, and OWASP security scans.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunDevOpsCheck('ping')}
                    disabled={devopsLoading}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${devopsLoading ? 'animate-spin' : ''}`} />
                    <span>Ping Servers</span>
                  </button>
                  <button
                    onClick={() => handleRunDevOpsCheck('security')}
                    disabled={devopsLoading}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Run Security Audit</span>
                  </button>
                </div>
              </div>

              {/* Server Telemetry Cards */}
              {devopsServer && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Uptime Status</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-base font-bold text-white capitalize">{devopsServer.status}</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold">{devopsServer.uptime_percentage}% 30-Day SLA</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Ping Latency</span>
                    <div className="text-base font-bold text-cyan-400">{devopsServer.last_ping_ms} ms</div>
                    <span className="text-[11px] text-slate-400">Target: {devopsServer.host_url}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">SSL Certificate</span>
                    <div className="text-base font-bold text-emerald-400">Valid & Active</div>
                    <span className="text-[11px] text-slate-400">Expires: {devopsServer.ssl_expiry_date}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Infrastructure Role</span>
                    <div className="text-base font-bold text-white">Production Node</div>
                    <span className="text-[11px] text-slate-400">IP: {devopsServer.ip_address}</span>
                  </div>
                </div>
              )}

              {/* Security Scan Result View */}
              {securityScanResult && (
                <div className="p-5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h2 className="font-bold text-sm text-white">Perimeter Cybersecurity Scan (OWASP Top 10)</h2>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Security Score: {securityScanResult.score}/100 (Grade {securityScanResult.grade})
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {securityScanResult.cybersecuritySentinelVerdict}
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">HTTP Security Header Verification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {securityScanResult.checks.map((check: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                          <span className="font-mono text-slate-300">{check.header}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {check.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: TASKS & KANBAN (WITH LEVEL 2 APPROVALS) */}
          {/* ============================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-400" />
                    <span>Tasks & Human-in-the-Loop Kanban Board</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Autonomous tasks execute freely at Level 1. Level 2 tasks pause here for Founder authorization.
                  </p>
                </div>
              </div>

              {/* Pending Approvals Strip */}
              {pendingApprovals.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Pending Level 2 Founder Authorization Checkpoints ({pendingApprovals.length})</span>
                  </div>

                  <div className="space-y-2">
                    {pendingApprovals.map((appr) => (
                      <div
                        key={appr.id}
                        className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-white">{appr.title}</h4>
                          <span className="text-[11px] text-slate-400 block">
                            Proposed by: <strong className="text-indigo-400">{appr.proposed_by_agent_id}</strong> | Action:{' '}
                            <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">{appr.action_type}</code>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectCheckpoint(appr.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveCheckpoint(appr.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Authorize & Dispatch</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks List Table */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Corporate Tasks ({tasks.length})</h3>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{task.task_title}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              task.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : task.status === 'waiting_approval'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Agent: <strong className="text-indigo-300">{task.agent_name || task.assigned_agent_id}</strong></span>
                          <span>•</span>
                          <span>Dept: <strong className="text-slate-300 capitalize">{task.department_key}</strong></span>
                          <span>•</span>
                          <span>Tokens: {task.tokens_used.toLocaleString()}</span>
                          <span>•</span>
                          <span>Cost: ${task.cost_usd.toFixed(4)}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        Autonomy: <strong className="text-slate-300">{task.autonomy_level}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: FINANCE & BILLING */}
          {/* ============================================================== */}
          {activeTab === 'finance' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-400" />
                    <span>Finance, Billing & Profitability Ledger</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Automated invoices, milestone payments, cloud expense tracking, and real-time gross margin calculation.
                  </p>
                </div>
              </div>

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Total Billed YTD</span>
                  <div className="text-xl font-black text-emerald-400">₹35,56,550</div>
                  <span className="text-[10px] text-slate-500">($42,850 USD equivalent)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Operational Expenses</span>
                  <div className="text-xl font-black text-amber-400">₹84,200</div>
                  <span className="text-[10px] text-slate-500">AI tokens, hosting, APIs</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Gross Margin</span>
                  <div className="text-xl font-black text-cyan-400">97.6%</div>
                  <span className="text-[10px] text-emerald-400">High efficiency AI model</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Active Retainers</span>
                  <div className="text-xl font-black text-purple-400">8 Clients</div>
                  <span className="text-[10px] text-slate-500">Recurring maintenance</span>
                </div>
              </div>

              {/* Invoices List */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Project Invoices</h3>
                <div className="space-y-2">
                  {[
                    { number: 'INV-2026-088', client: 'Apex Global Logistics', amount: 145000, status: 'paid', date: '2026-11-15' },
                    { number: 'INV-2026-089', client: 'Nova Retail Ventures', amount: 85000, status: 'issued', date: '2026-11-18' },
                    { number: 'INV-2026-090', client: 'FinFlow Technologies', amount: 210000, status: 'paid', date: '2026-11-12' },
                  ].map((inv, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-white">{inv.number}</span>
                        <span className="text-slate-400 block">{inv.client}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">₹{inv.amount.toLocaleString('en-IN')}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase block mt-0.5 ${
                            inv.status === 'paid' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: EXECUTIVE REPORTS */}
          {/* ============================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span>Executive Performance Reports</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Compiled directly by CEO Victoria Vance and Business Analytics Agent Francesca Rossi.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setReportLoading(true);
                    try {
                      const res = await fetch('/api/vitos/command', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: "Prepare today's executive company performance report" }),
                      });
                      const data = await res.json();
                      setDailyReport(data.data?.summary || 'Report compiled successfully.');
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setReportLoading(false);
                    }
                  }}
                  disabled={reportLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reportLoading ? 'animate-spin' : ''}`} />
                  <span>Generate Live Daily Briefing</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm text-white">Daily Operational Briefing</span>
                  <span className="text-xs text-indigo-400 font-mono">Date: Nov 20, 2026</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                  {dailyReport ||
                    `Executive Corporate Performance Briefing\n\n1. Overall Operational Velocity: 99.8% on-time milestone delivery.\n2. Department Utilization: WebDev studio running 9 concurrent Next.js & React builds; Reverse Engineering Lab audited 4 competitor architectures.\n3. DevOps Perimeter: Zero outages across all 8 customer clusters. Let's Encrypt SSL certificates healthy.\n4. Revenue Velocity: High gross profit margins maintained under multi-agent governance.`}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: ALL OTHER 12 SECTIONS (CLEAN, MODULAR VIEWS) */}
          {/* ============================================================== */}
          {['dashboard', 'departments', 'clients', 'projects', 'studio', 'marketing', 'social', 'support', 'knowledge', 'integrations', 'settings'].includes(activeTab) && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight capitalize flex items-center gap-2">
                    <span>{activeTab.replace(/([A-Z])/g, ' $1')} Management</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Autonomous subsystem connected to the Central AI Command Centre.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white capitalize">{activeTab} Workspace Active</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This module is governed by specialized AI employees. Use the Central AI Command Centre to issue commands or configure custom automated pipelines.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('command')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Open AI Command Centre
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
