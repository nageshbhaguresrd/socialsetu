'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  LayoutDashboard,
  Calendar,
  Share2,
  Sparkles,
  Gift,
  Settings,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  Check,
  X,
  ChevronDown,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Loader2,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// Types
interface Client {
  id: string;
  name: string;
  business_category?: string;
  website_url?: string;
  industry?: string;
  city?: string;
  preferred_language: 'English' | 'Hindi' | 'Marathi' | 'Hinglish';
  brand_profile?: any[];
  accounts?: any[];
  permissions?: any[];
}

interface SocialAccount {
  id: string;
  client_id: string;
  platform: 'instagram' | 'facebook_page' | 'linkedin_page' | 'youtube' | 'x_twitter';
  account_name: string;
  account_handle?: string;
  connection_status: 'connected' | 'disconnected' | 'token_expired';
  profile_picture_url?: string;
}

interface ContentPost {
  id: string;
  client_id: string;
  headline?: string;
  primary_caption: string;
  target_platforms: string[];
  platform_variants?: Record<string, any>;
  media_urls?: string[];
  hashtags?: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'rejected';
  scheduled_at?: string;
  published_at?: string;
}

interface CelebrationEvent {
  id: string;
  contactId: string;
  contactName: string;
  relationship: string;
  email?: string;
  phone?: string;
  eventType: 'birthday' | 'anniversary';
  eventDate: string;
  daysUntil: number;
  milestone?: number;
}

export default function AgencyPortalPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'accounts' | 'ai_studio' | 'calendar' | 'celebrations' | 'settings'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Data states for active client
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationEvent[]>([]);

  // Modals
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string>('instagram');

  // AI Studio states
  const [topic, setTopic] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('Brand Awareness & Authority');
  const [aiLanguage, setAiLanguage] = useState<'English' | 'Hindi' | 'Marathi' | 'Hinglish'>('English');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedMaster, setGeneratedMaster] = useState<any | null>(null);
  const [adaptations, setAdaptations] = useState<Record<string, any> | null>(null);
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState<string>('instagram');
  const [complianceResult, setComplianceResult] = useState<any | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Contact / Celebration creation states
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    relationship: 'Customer',
    phone: '',
    email: '',
    birthday: '',
    anniversary: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const currentClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Initial load clients
  useEffect(() => {
    let isMounted = true;
    async function fetchClients() {
      try {
        const res = await fetch('/api/v2/clients');
        const data = await res.json();
        if (isMounted && data.clients && data.clients.length > 0) {
          setClients(data.clients);
          setSelectedClientId((prev) => prev || data.clients[0].id);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    fetchClients();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load active client data (accounts, posts, celebrations)
  useEffect(() => {
    if (!selectedClientId) return;
    let isMounted = true;

    async function fetchDetails() {
      try {
        const [accRes, postsRes, celRes] = await Promise.all([
          fetch(`/api/v2/social-accounts?clientId=${selectedClientId}`),
          fetch(`/api/v2/posts?clientId=${selectedClientId}`),
          fetch(`/api/v2/celebrations?clientId=${selectedClientId}`),
        ]);
        const [accData, postsData, celData] = await Promise.all([
          accRes.json(),
          postsRes.json(),
          celRes.json(),
        ]);
        if (isMounted) {
          setAccounts(accData.accounts || []);
          setPosts(postsData.posts || []);
          setCelebrations(celData.upcomingEvents || []);
        }
      } catch {
        // ignore
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedClientId]);

  const loadClients = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/v2/clients');
      const data = await res.json();
      if (data.clients && data.clients.length > 0) {
        setClients(data.clients);
        setSelectedClientId((prev) => prev || data.clients[0].id);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadClientDetails = useCallback(async (clientId: string) => {
    if (!clientId) return;
    try {
      const [accRes, postsRes, celRes] = await Promise.all([
        fetch(`/api/v2/social-accounts?clientId=${clientId}`),
        fetch(`/api/v2/posts?clientId=${clientId}`),
        fetch(`/api/v2/celebrations?clientId=${clientId}`),
      ]);
      const [accData, postsData, celData] = await Promise.all([
        accRes.json(),
        postsRes.json(),
        celRes.json(),
      ]);
      setAccounts(accData.accounts || []);
      setPosts(postsData.posts || []);
      setCelebrations(celData.upcomingEvents || []);
    } catch {
      // ignore
    }
  }, []);

  // Handle Client Creation
  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get('name') as string,
      business_category: formData.get('business_category') as string,
      website_url: formData.get('website_url') as string,
      industry: formData.get('industry') as string,
      city: formData.get('city') as string,
      preferred_language: formData.get('preferred_language') as string,
      brand_voice: formData.get('brand_voice') as string,
      primary_color: formData.get('primary_color') as string,
    };

    try {
      const res = await fetch('/api/v2/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Client workspace "${payload.name}" created!`, 'success');
      setShowCreateClientModal(false);
      await loadClients();
      if (data.client?.id) {
        setSelectedClientId(data.client.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    }
  };

  // Handle Connect Social Account (OAuth or direct token)
  const handleConnectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('token') as string;
    const handle = formData.get('handle') as string;

    try {
      const res = await fetch('/api/v2/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          platform: connectPlatform,
          accountHandle: handle,
          accountName: `${currentClient?.name || 'Client'} (${connectPlatform})`,
          accessToken: token || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Connected ${connectPlatform} account successfully!`, 'success');
      setShowConnectModal(false);
      loadClientDetails(selectedClientId);
    } catch (err: any) {
      showToast(err.message || 'Failed to connect account', 'error');
    }
  };

  // AI Generation
  const handleGeneratePost = async () => {
    if (!topic.trim()) {
      showToast('Please enter a content topic', 'error');
      return;
    }
    setAiGenerating(true);
    setComplianceResult(null);

    try {
      const res = await fetch('/api/v2/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          topic,
          campaignGoal,
          language: aiLanguage,
          autoAdapt: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedMaster(data.content);
      setAdaptations(data.adaptations);

      // Run live compliance inspection
      const inspectRes = await fetch('/api/v2/ai/inspect-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content.caption,
          platform: selectedPreviewPlatform,
          brandVoice: currentClient?.brand_profile?.[0]?.brand_voice || 'Professional',
        }),
      });
      const inspectData = await inspectRes.json();
      if (inspectData.inspection) {
        setComplianceResult(inspectData.inspection);
      }

      showToast('AI crafted post and generated 5-network adaptations!', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI generation failed', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Schedule / Save Post
  const handleSavePost = async (publishImmediately: boolean = false) => {
    if (!generatedMaster) return;

    try {
      const res = await fetch('/api/v2/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          headline: generatedMaster.headline,
          primaryCaption: generatedMaster.caption,
          postType: 'post',
          targetPlatforms: [selectedPreviewPlatform],
          platformVariants: adaptations || {},
          hashtags: generatedMaster.hashtags || [],
          scheduledAt: scheduledDateTime || null,
          publishImmediately,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(
        publishImmediately
          ? 'Post sent to publishing queue!'
          : 'Post scheduled successfully!',
        'success'
      );
      loadClientDetails(selectedClientId);
      setActiveTab('calendar');
    } catch (err: any) {
      showToast(err.message || 'Failed to save post', 'error');
    }
  };

  // Approve / Reject Post
  const handlePostApproval = async (postId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/v2/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Post ${action}d successfully!`, 'success');
      loadClientDetails(selectedClientId);
    } catch (err: any) {
      showToast(err.message || 'Approval action failed', 'error');
    }
  };

  // Trigger Immediate Publisher Cron
  const handleTriggerPublishNow = async () => {
    try {
      const res = await fetch('/api/cron/publisher?secret=dev-cron-secret-12345');
      const data = await res.json();
      showToast(
        `Publisher executed: ${data.processed || 0} posts processed`,
        'success'
      );
      loadClientDetails(selectedClientId);
    } catch {
      showToast('Failed to trigger publisher', 'error');
    }
  };

  // Add Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v2/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          ...newContact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Contact added successfully!', 'success');
      setShowAddContactModal(false);
      setNewContact({
        firstName: '',
        lastName: '',
        relationship: 'Customer',
        phone: '',
        email: '',
        birthday: '',
        anniversary: '',
      });
      loadClientDetails(selectedClientId);
    } catch (err: any) {
      showToast(err.message || 'Failed to add contact', 'error');
    }
  };

  // Generate Greeting for Celebration
  const handleGenerateCelebration = async (event: CelebrationEvent) => {
    try {
      const res = await fetch('/api/v2/celebrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          contactId: event.contactId,
          eventType: event.eventType,
          language: currentClient?.preferred_language || 'English',
          autoCreatePost: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(
        `Generated AI ${event.eventType} greeting and added to approval queue!`,
        'success'
      );
      loadClientDetails(selectedClientId);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate greeting', 'error');
    }
  };

  const getPlatformIcon = (platform: string, size = 18) => {
    switch (platform) {
      case 'instagram':
        return <Instagram size={size} className="text-pink-500" />;
      case 'facebook_page':
        return <Facebook size={size} className="text-blue-500" />;
      case 'linkedin_page':
        return <Linkedin size={size} className="text-sky-500" />;
      case 'youtube':
        return <Youtube size={size} className="text-red-500" />;
      case 'x_twitter':
        return <Twitter size={size} className="text-slate-200" />;
      default:
        return <Share2 size={size} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 flex flex-col font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold ${
              toastMsg.type === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-red-500 text-white shadow-red-500/20'
            }`}
          >
            {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-[#1E1E35] bg-[#0F0F1A]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF6B35] to-[#FFA07A] flex items-center justify-center font-black text-black text-base shadow-lg shadow-orange-500/20">
              S
            </span>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SocialSetu <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30 ml-1">Enterprise</span>
            </span>
          </Link>

          {/* Client Workspace Selector */}
          <div className="flex items-center gap-2 bg-[#1A1A2E] border border-[#2A2A45] rounded-xl px-3 py-1.5">
            <Users size={14} className="text-[#FF6B35]" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A1A2E] text-white">
                  {c.name} ({c.business_category || 'Agency Client'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateClientModal(true)}
            className="flex items-center gap-1.5 text-xs text-[#FF6B35] hover:text-[#FFA07A] font-semibold transition-colors"
          >
            <Plus size={14} /> New Client
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <Link
            href="/crm"
            className="text-xs px-3 py-1.5 rounded-xl border border-[#2A2A45] bg-[#16162A] text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            Switch to Sales CRM <ArrowRight size={13} />
          </Link>
          <button
            onClick={() => {
              if (selectedClientId) loadClientDetails(selectedClientId);
            }}
            disabled={refreshing}
            className="p-2 rounded-xl border border-[#2A2A45] bg-[#16162A] text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-[#1E1E35] bg-[#0B0B16] p-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'accounts', label: 'Connected Accounts', icon: Share2, badge: accounts.length },
              { id: 'ai_studio', label: 'AI Content Studio', icon: Sparkles },
              { id: 'calendar', label: 'Content Calendar', icon: Calendar, badge: posts.length },
              { id: 'celebrations', label: 'Celebrations & CRM', icon: Gift, badge: celebrations.length },
              { id: 'settings', label: 'Brand Guidelines', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-[#151528]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-black/30 text-white' : 'bg-[#1E1E35] text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active Client Info Card */}
          <div className="p-3.5 rounded-2xl bg-[#121224] border border-[#22223D]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Active Client
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">{currentClient?.name || 'No Client'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{currentClient?.business_category || 'General'}</p>
            <div className="mt-2.5 pt-2 border-t border-[#1E1E35] flex items-center justify-between text-[10px] text-slate-400">
              <span>Lang: {currentClient?.preferred_language || 'English'}</span>
              <span className="text-emerald-400 font-semibold">{accounts.length} Live Channels</span>
            </div>
          </div>
        </aside>

        {/* Central Content Canvas */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {currentClient?.name} — Social Operations
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Multi-account publishing, automated engagement, and AI-driven growth telemetry.
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Channels</p>
                  <p className="text-3xl font-black text-white mt-1">{accounts.length}</p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Connected & Healthy
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Posts</p>
                  <p className="text-3xl font-black text-[#FF6B35] mt-1">
                    {posts.filter((p) => p.status === 'scheduled').length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Awaiting auto-publish</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                  <p className="text-3xl font-black text-amber-400 mt-1">
                    {posts.filter((p) => p.status === 'pending_approval').length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Client review required</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Celebrations</p>
                  <p className="text-3xl font-black text-indigo-400 mt-1">{celebrations.length}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Next 14 days</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#121224] to-[#181830] border border-[#22223D] flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FF6B35]" /> Instant AI Campaign Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Draft a master campaign concept and adapt it automatically for Instagram, Facebook, LinkedIn, YouTube, and X in seconds.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('ai_studio')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-all whitespace-nowrap"
                >
                  Open AI Studio
                </button>
              </div>

              {/* Recent Posts Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Recent Content Queue</h3>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="text-xs text-[#FF6B35] font-semibold hover:underline"
                  >
                    View All Calendar Posts &rarr;
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] text-center">
                    <p className="text-xs text-slate-400">No posts created yet for this client workspace.</p>
                    <button
                      onClick={() => setActiveTab('ai_studio')}
                      className="mt-3 px-4 py-2 rounded-xl bg-[#1A1A2E] border border-[#2A2A45] text-xs font-semibold text-white hover:border-[#FF6B35]"
                    >
                      Generate First Post with AI
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              {p.target_platforms.map((plt) => (
                                <span key={plt}>{getPlatformIcon(plt, 14)}</span>
                              ))}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                p.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : p.status === 'scheduled'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : p.status === 'pending_approval'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-500/20 text-slate-400'
                              }`}
                            >
                              {p.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white line-clamp-2">
                            {p.headline || p.primary_caption}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#1A1A2E] flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {p.scheduled_at
                              ? new Date(p.scheduled_at).toLocaleDateString()
                              : 'Draft'}
                          </span>
                          {p.status === 'pending_approval' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePostApproval(p.id, 'approve')}
                                className="text-emerald-400 hover:text-emerald-300 font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handlePostApproval(p.id, 'reject')}
                                className="text-red-400 hover:text-red-300 font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED SOCIAL ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Connected Social Accounts</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage official OAuth connections for {currentClient?.name}.
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Plus size={14} /> Connect Platform Account
                </button>
              </div>

              {/* Supported Platforms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'instagram', name: 'Instagram Business', icon: Instagram, color: 'text-pink-500' },
                  { id: 'facebook_page', name: 'Facebook Page', icon: Facebook, color: 'text-blue-500' },
                  { id: 'linkedin_page', name: 'LinkedIn Company', icon: Linkedin, color: 'text-sky-500' },
                  { id: 'youtube', name: 'YouTube Channel', icon: Youtube, color: 'text-red-500' },
                  { id: 'x_twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-slate-200' },
                ].map((plt) => {
                  const existing = accounts.find((a) => a.platform === plt.id && a.connection_status === 'connected');
                  const Icon = plt.icon;

                  return (
                    <div
                      key={plt.id}
                      className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-[#1A1A2E]">
                            <Icon size={22} className={plt.color} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{plt.name}</h4>
                            <span className="text-[10px] text-slate-400">
                              {existing ? existing.account_handle || 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            existing ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      {existing ? (
                        <div className="pt-3 border-t border-[#1E1E35] flex items-center justify-between text-xs">
                          <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                            <CheckCircle2 size={12} /> Active
                          </span>
                          <button
                            onClick={async () => {
                              await fetch(`/api/v2/social-accounts?id=${existing.id}`, { method: 'DELETE' });
                              showToast(`Disconnected ${plt.name}`, 'success');
                              loadClientDetails(selectedClientId);
                            }}
                            className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setConnectPlatform(plt.id);
                            setShowConnectModal(true);
                          }}
                          className="w-full py-2 rounded-xl bg-[#1A1A2E] hover:bg-[#252542] border border-[#2A2A45] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={13} /> Link Account
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AI SOCIAL STUDIO */}
          {activeTab === 'ai_studio' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-[#FF6B35]" /> AI Social Media Studio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Multilingual AI copywriter powered by Gemini 3.8 Flash, tailored to {currentClient?.name}&apos;s brand guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs Left Column */}
                <div className="lg:col-span-5 space-y-4 bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Content Topic / Campaign Angle
                    </label>
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. 5 cost-saving strategies for small retailers during festival season"
                      rows={3}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FF6B35] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Language
                      </label>
                      <select
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value as any)}
                        className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Hinglish">Hinglish</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Campaign Goal
                      </label>
                      <select
                        value={campaignGoal}
                        onChange={(e) => setCampaignGoal(e.target.value)}
                        className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        <option>Brand Awareness</option>
                        <option>Lead Generation</option>
                        <option>Direct Conversions</option>
                        <option>Community Engagement</option>
                        <option>Festival / Holiday</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGeneratePost}
                    disabled={aiGenerating}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Generating Master Post...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Generate Master & Adaptations
                      </>
                    )}
                  </button>

                  {/* Compliance Ring & Checker */}
                  {complianceResult && (
                    <div className="p-4 rounded-2xl bg-[#141426] border border-[#23233D] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-400" /> Compliance Check
                        </span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            complianceResult.score >= 80 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          Score: {complianceResult.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {complianceResult.isApproved
                          ? 'Approved: Meets platform character limits and brand voice rules.'
                          : 'Flagged: Review suggestions before scheduling.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Output & 5-Network Adaptation Tabs Right Column */}
                <div className="lg:col-span-7 bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-6 flex flex-col justify-between">
                  {generatedMaster ? (
                    <div className="space-y-4">
                      {/* Platform Adaptation Selector */}
                      <div className="flex items-center gap-2 border-b border-[#1E1E35] pb-3 overflow-x-auto">
                        {[
                          { id: 'instagram', label: 'Instagram', icon: Instagram },
                          { id: 'facebook_page', label: 'Facebook', icon: Facebook },
                          { id: 'linkedin_page', label: 'LinkedIn', icon: Linkedin },
                          { id: 'youtube', label: 'YouTube', icon: Youtube },
                          { id: 'x_twitter', label: 'X', icon: Twitter },
                        ].map((net) => {
                          const Icon = net.icon;
                          const isSelected = selectedPreviewPlatform === net.id;
                          return (
                            <button
                              key={net.id}
                              onClick={() => setSelectedPreviewPlatform(net.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? 'bg-[#1E1E38] text-white border border-[#3A3A60]'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Icon size={14} /> {net.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Content Preview Box */}
                      <div className="bg-[#141426] border border-[#23233D] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Platform: <b className="text-white capitalize">{selectedPreviewPlatform.replace('_', ' ')}</b>
                          </span>
                          <span>
                            Length:{' '}
                            {(
                              adaptations?.[selectedPreviewPlatform]?.caption ||
                              generatedMaster.caption
                            ).length}{' '}
                            chars
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                          {adaptations?.[selectedPreviewPlatform]?.caption ||
                            generatedMaster.caption}
                        </div>
                        {generatedMaster.hashtags && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1E1E35]">
                            {generatedMaster.hashtags.map((h: string) => (
                              <span
                                key={h}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-[#1E1E35] text-[#FF6B35] font-mono"
                              >
                                #{h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Scheduling & Publish Controls */}
                      <div className="pt-3 border-t border-[#1E1E35] flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="datetime-local"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                          className="bg-[#1A1A2E] border border-[#2A2A45] rounded-xl px-3 py-2 text-xs text-white outline-none flex-1"
                        />
                        <button
                          onClick={() => handleSavePost(false)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#1A1A2E] hover:bg-[#252542] border border-[#2A2A45] text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <Clock size={14} /> Schedule Post
                        </button>
                        <button
                          onClick={() => handleSavePost(true)}
                          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Send size={14} /> Publish Queue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                      <Sparkles size={36} className="text-[#FF6B35]/40 mb-3" />
                      <p className="text-xs font-semibold text-slate-300">
                        AI Content Canvas is Ready
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                        Enter your campaign topic on the left and let Gemini generate platform-native copy in your preferred language.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTENT CALENDAR & QUEUE */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Content Calendar & Queue</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled posts and client approval pipeline.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTriggerPublishNow}
                    className="px-3.5 py-2 rounded-xl bg-[#1A1A2E] border border-[#2A2A45] text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Send size={13} className="text-[#FF6B35]" /> Run Publisher Cron
                  </button>
                  <button
                    onClick={() => setActiveTab('ai_studio')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Create Post
                  </button>
                </div>
              </div>

              {posts.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#0F0F1A] border border-[#1E1E35] text-center">
                  <Calendar size={36} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white">No posts scheduled</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Use AI Studio to create drafts and schedule them for automatic publishing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#1A1A2E] mt-0.5">
                          {getPlatformIcon(post.target_platforms[0] || 'instagram', 20)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                post.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : post.status === 'scheduled'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : post.status === 'pending_approval'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-500/20 text-slate-400'
                              }`}
                            >
                              {post.status.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {post.scheduled_at
                                ? new Date(post.scheduled_at).toLocaleString()
                                : 'Immediate Queue'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">{post.headline || 'Social Post'}</p>
                          <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">
                            {post.primary_caption}
                          </p>
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {post.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handlePostApproval(post.id, 'approve')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handlePostApproval(post.id, 'reject')}
                              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1"
                            >
                              <X size={13} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CELEBRATION GREETINGS & CRM */}
          {activeTab === 'celebrations' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Gift size={20} className="text-[#FF6B35]" /> Celebrations & Relationship Marketing
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Automated birthday and anniversary greeting generator for {currentClient?.name}&apos;s customer base.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Contact
                </button>
              </div>

              {/* Upcoming Celebrations Alert Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming Events (Next 14 Days)
                </h3>

                {celebrations.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] text-center">
                    <p className="text-xs text-slate-400">
                      No upcoming birthdays or anniversaries detected for this client&apos;s contacts.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {celebrations.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-5 rounded-2xl bg-[#0F0F1A] border border-[#1E1E35] flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                ev.eventType === 'birthday'
                                  ? 'bg-pink-500/20 text-pink-400'
                                  : 'bg-indigo-500/20 text-indigo-400'
                              }`}
                            >
                              {ev.eventType}
                            </span>
                            <span className="text-[11px] text-[#FF6B35] font-semibold">
                              {ev.daysUntil === 0 ? 'Today! 🎉' : `In ${ev.daysUntil} days`}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white">{ev.contactName}</p>
                          <p className="text-[11px] text-slate-400">
                            {ev.relationship} {ev.milestone ? `• ${ev.milestone} Years` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGenerateCelebration(ev)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 hover:scale-105 transition-all"
                          >
                            <Sparkles size={12} /> Draft Greeting
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: BRAND GUIDELINES & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-xl font-black text-white">Client Brand Guidelines</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure brand voice, forbidden words, and workspace defaults for {currentClient?.name}.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#0F0F1A] border border-[#1E1E35] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentClient?.name || ''}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-xs text-white opacity-80"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Business Category
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentClient?.business_category || 'General'}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-xs text-white opacity-80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Preferred Language
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentClient?.preferred_language || 'English'}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-xs text-white opacity-80"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Approval Policy
                    </label>
                    <div className="p-3 rounded-xl bg-[#1A1A2E] border border-[#2A2A45] text-xs text-emerald-400 font-semibold flex items-center gap-2">
                      <ShieldCheck size={16} /> All Posts Require Client Approval Before Publishing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Create Client Workspace */}
      <AnimatePresence>
        {showCreateClientModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E35]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus size={16} className="text-[#FF6B35]" /> Create Client Workspace
                </h3>
                <button
                  onClick={() => setShowCreateClientModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Client / Business Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Pune Health Clinic"
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Business Category
                    </label>
                    <input
                      name="business_category"
                      placeholder="e.g. Healthcare"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      City
                    </label>
                    <input
                      name="city"
                      placeholder="e.g. Pune"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Preferred Language
                    </label>
                    <select
                      name="preferred_language"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Brand Voice
                    </label>
                    <input
                      name="brand_voice"
                      placeholder="e.g. Warm and authoritative"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E1E35] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateClientModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                  >
                    Create Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Connect Social Account */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E35]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {getPlatformIcon(connectPlatform, 18)} Connect {connectPlatform.replace('_', ' ')}
                </h3>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Account Handle / Username
                  </label>
                  <input
                    name="handle"
                    required
                    placeholder="@businesshandle"
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Access Token / API Key (Optional if OAuth configured)
                  </label>
                  <input
                    name="token"
                    type="password"
                    placeholder="Paste platform access token if manual connection"
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-[#1E1E35] flex items-center justify-between">
                  <a
                    href={`/api/v2/social-accounts/connect/${connectPlatform}?clientId=${selectedClientId}`}
                    className="text-xs text-[#FF6B35] font-semibold hover:underline flex items-center gap-1"
                  >
                    Use Official OAuth Flow <ExternalLink size={12} />
                  </a>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                  >
                    Link Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Add Contact */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E35]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gift size={16} className="text-[#FF6B35]" /> Add Contact for Celebrations
                </h3>
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      First Name
                    </label>
                    <input
                      required
                      value={newContact.firstName}
                      onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                      placeholder="e.g. Ramesh"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Last Name
                    </label>
                    <input
                      value={newContact.lastName}
                      onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                      placeholder="e.g. Patil"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Birthday (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={newContact.birthday}
                      onChange={(e) => setNewContact({ ...newContact, birthday: e.target.value })}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Anniversary (Optional)
                    </label>
                    <input
                      type="date"
                      value={newContact.anniversary}
                      onChange={(e) => setNewContact({ ...newContact, anniversary: e.target.value })}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Phone (WhatsApp)
                    </label>
                    <input
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Relationship
                    </label>
                    <select
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="Customer">Customer</option>
                      <option value="VIP Partner">VIP Partner</option>
                      <option value="Team Member">Team Member</option>
                      <option value="Supplier">Supplier</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1E1E35] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D04] text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
