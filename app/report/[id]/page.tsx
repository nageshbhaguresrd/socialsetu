'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Rocket,
  ShieldCheck,
  AlertCircle,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  Zap,
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Loader2,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PLATFORM_ICONS: Record<string, any> = {
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
};

function getGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export default function PublicReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const supabase = createClient();
        // Query by share_id or by id
        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .or(`share_id.eq.${id},id.eq.${id}`)
          .single();

        if (data && !error) {
          setAudit(data);
        }
      } catch (err) {
        console.error('Failed to load shared audit:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!audit) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/audit/${audit.id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SocialSetu-Audit-${(audit.client_name || 'Report').replace(/[^a-z0-9]/gi, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080812] flex flex-col items-center justify-center text-white">
        <Loader2 size={36} className="text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-400 font-medium text-sm">Loading your digital audit report...</p>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#080812] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Audit Report Not Found</h1>
        <p className="text-gray-400 text-sm max-w-md mb-8">
          This audit report link may have expired or is invalid. Please contact SocialSetu to request a new audit.
        </p>
        <Link
          href="/"
          className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
        >
          Return to SocialSetu Home
        </Link>
      </div>
    );
  }

  const report = typeof audit.report === 'string' ? JSON.parse(audit.report) : (audit.report || {});
  const scores = audit.scores || report.scores || {};
  const overallScore = report.overallScore ?? scores.overall ?? 65;
  const grade = getGrade(overallScore);

  const whatsappMessage = encodeURIComponent(
    `Hi SocialSetu team! I reviewed my brand audit report for "${audit.client_name}" (Overall Score: ${overallScore}/100). I'd like to book a 30-minute free growth strategy call.`
  );

  return (
    <div className="min-h-screen bg-[#080812] text-white selection:bg-[#FF6B35]/30">
      {/* Top Banner */}
      <div className="border-b border-[#1E1E35] bg-[#0A0A16]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-sm font-black">
              SS
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-gray-200 transition-colors">
              Social<span className="text-[#FF6B35]">Setu</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
              Verified Audit
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#252542] border border-[#1E1E35] text-xs font-semibold px-4 py-2 rounded-xl text-gray-300 transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-[#FF6B35]/20"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {/* Hero Score Card */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#121226] to-[#0A0A16] border border-[#1E1E35] rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] text-xs font-bold mb-4">
                <Sparkles size={14} /> AI Performance Audit
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {audit.client_name}
              </h1>
              <p className="text-gray-400 text-sm mt-2 max-w-xl leading-relaxed">
                {report.summary || `Comprehensive social media and digital growth audit prepared for ${audit.client_name}.`}
              </p>
              <div className="text-xs text-gray-500 mt-4">
                Audit Generated on{' '}
                {new Date(audit.updated_at || audit.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#080812]/80 border border-[#1E1E35] rounded-2xl min-w-[180px]">
              <div className="relative flex items-center justify-center h-28 w-28">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1E1E35" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={overallScore >= 70 ? '#10B981' : overallScore >= 45 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - overallScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono">{overallScore}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">/ 100</span>
                </div>
              </div>
              <div className="mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white">
                Grade {grade}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Pillars */}
        {scores && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Profile Completeness', val: scores.profileCompleteness ?? 75 },
              { label: 'Content Consistency', val: scores.contentConsistency ?? 65 },
              { label: 'Engagement Rate', val: scores.engagementRate ?? 60 },
              { label: 'Growth Potential', val: scores.growthPotential ?? 70 },
              { label: 'Brand Presence', val: scores.brandPresence ?? 68 },
            ].map(m => (
              <div key={m.label} className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-4 text-center">
                <p className="text-2xl font-black font-mono text-white">{m.val}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{m.label}</p>
                <div className="mt-3 h-1.5 w-full bg-[#1A1A2E] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${m.val}%`,
                      backgroundColor: m.val >= 70 ? '#10B981' : m.val >= 45 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Platform Breakdown */}
        {report.platforms && Object.keys(report.platforms).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Platform Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(report.platforms).map(([platform, data]: [string, any]) => {
                const Icon = PLATFORM_ICONS[platform] || ShieldCheck;
                const color = PLATFORM_COLORS[platform] || '#FF6B35';
                return (
                  <div
                    key={platform}
                    className="bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-6 space-y-4 hover:border-[#1E1E35]/80 transition-all"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#1E1E35]">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold capitalize text-base">{platform}</h3>
                          <p className="text-xs text-gray-500">Channel Evaluation</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-mono" style={{ color }}>
                          {data.score}/100
                        </span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-300 font-bold">
                          Grade {data.grade || getGrade(data.score)}
                        </span>
                      </div>
                    </div>

                    {data.strengths?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={12} /> Key Strengths
                        </h4>
                        <ul className="text-xs space-y-1.5 text-gray-300">
                          {data.strengths.slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-500 shrink-0">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.weaknesses?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-2">
                          <XCircle size={12} /> Areas to Fix
                        </h4>
                        <ul className="text-xs space-y-1.5 text-gray-300">
                          {data.weaknesses.slice(0, 3).map((w: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-400 shrink-0">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.quickWins?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B35] flex items-center gap-1.5 mb-2">
                          <Zap size={12} /> Quick Wins
                        </h4>
                        <ul className="text-xs space-y-1.5 text-gray-300">
                          {data.quickWins.slice(0, 2).map((q: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#FF6B35] shrink-0">⚡</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Critical Issues & Recommendations */}
        {report.topIssues?.length > 0 && (
          <div className="bg-[#0F0F1A] border border-red-500/20 rounded-3xl p-8">
            <h3 className="flex items-center gap-2 text-base font-bold text-red-400 uppercase tracking-wider mb-4">
              <AlertCircle size={18} /> Top Priorities to Address
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {report.topIssues.map((issue: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion CTA Box */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1A102E] via-[#2A1020] to-[#1F0E05] border border-[#FF6B35]/30 rounded-3xl p-8 md:p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-[#FF6B35]/20 text-[#FF6B35] mb-2">
              <Rocket size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Ready to Turn These Insights into Revenue?
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              SocialSetu helps Indian brands increase organic reach, run high-converting Meta and Google ads,
              and build reliable inbound lead machines. Let&apos;s map out your 90-day growth roadmap together.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold px-8 py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                Claim Free Strategy Call on WhatsApp <ArrowRight size={16} />
              </a>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-4 rounded-2xl text-sm transition-all"
              >
                Save PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
