'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
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
  AlertTriangle,
} from 'lucide-react'
import type { Audit, AuditReport } from '@/lib/types/audit'

const PLATFORM_ICONS: Record<string, any> = {
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
}

const SCORE_MESSAGES = [
  'Fetching YouTube data...',
  'Analyzing Instagram presence...',
  'Running AI analysis...',
  'Generating recommendations...',
  'Building your report...',
]

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center h-32 w-32">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1E1E35" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-poppins" style={{ color }}>{score}</span>
        <span className="text-[10px] text-[#666]">/ 100</span>
      </div>
    </div>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', F: '#EF4444',
  }
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-bold text-white"
      style={{ background: colors[grade] || '#666' }}
    >
      Grade {grade}
    </span>
  )
}

function getGrade(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export default function AuditResultPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.id as string

  const [audit, setAudit] = useState<Audit | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageIdx, setMessageIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit/${auditId}`)
      if (!res.ok) throw new Error('Failed to load audit')
      const data = await res.json()
      setAudit(data)
      if (data.report && typeof data.report === 'object' && data.status === 'completed') {
        setReport(data.report as AuditReport)
        setLoading(false)
        return true
      }
      if (data.status === 'failed') {
        setLoading(false)
        setError('Audit generation failed. Please try again.')
        return true
      }
      return false
    } catch {
      setLoading(false)
      setError('Failed to load audit')
      return true
    }
  }, [auditId])

  // Split: one effect to fetch, separate effect to start polling
  const [needsPoll, setNeedsPoll] = useState(false)

  useEffect(() => {
    const run = async () => {
      const done = await fetchAudit()
      if (!done) setNeedsPoll(true)
    }
    run()
  }, [auditId, fetchAudit])

  useEffect(() => {
    if (!needsPoll) return
    
    let msgIdx = 0
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % SCORE_MESSAGES.length
      setMessageIdx(msgIdx)
      fetch(`/api/audit/${auditId}/status`)
        .then(r => r.json())
        .then(data => {
          // Stop polling if completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval)
            if (data.status === 'completed') {
              fetchAudit()
              setNeedsPoll(false)
            } else {
              setLoading(false)
              setNeedsPoll(false)
              setError('Audit generation failed. Please try again.')
            }
          }
        })
        .catch(() => {
          clearInterval(interval)
          setLoading(false)
          setNeedsPoll(false)
          setError('Failed to poll status. Please try again.')
        })
    }, 3000)
    
    // Timeout protection - stop polling after 120 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setLoading(false)
      setNeedsPoll(false)
      setError('Audit timeout. Please try again.')
    }, 120000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [needsPoll, auditId, fetchAudit])

  const handleDownload = async () => {
    if (!audit) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/audit/${auditId}/pdf`, { method: 'POST' })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SocialSetu-Audit-${audit.client_name.replace(/[^a-z0-9]/gi, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#080812] text-white">
      {/* Header */}
      <div className="border-b border-[#1E1E35] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/crm')}
            className="flex items-center gap-2 text-[#666] hover:text-white transition-all text-sm"
          >
            <ArrowLeft size={16} />
            Back to CRM
          </button>
        </div>
        {report && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-[#1A1A2E] border border-[#1E1E35] text-[#666] hover:text-white text-sm px-4 py-2 rounded-xl transition-all"
            >
              {copied ? <Check size={14} className="text-[#10B981]" /> : <Share2 size={14} />}
              {copied ? 'Link copied!' : 'Share'}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-bold text-white transition-all"
              style={{ background: downloading ? '#2A2A45' : '#FF6B35' }}
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Loading / Polling State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <ScoreGauge score={0} />
            <div className="space-y-2 text-center">
              <p className="text-sm font-bold text-white">Audit in Progress</p>
              <p className="text-xs text-[#666] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                {SCORE_MESSAGES[messageIdx]}
              </p>
            </div>
            <div className="w-64 h-1 bg-[#1E1E35] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
                style={{ width: `${((messageIdx + 1) / SCORE_MESSAGES.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <AlertTriangle size={48} className="text-[#EF4444]" />
            <p className="text-white font-bold">{error}</p>
            <button
              onClick={() => router.push('/audit/new')}
              className="text-sm text-[#FF6B35] hover:underline"
            >
              Start a new audit
            </button>
          </div>
        )}

        {/* Report */}
        {report && audit && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold font-poppins text-white">{audit.client_name}</h1>
                <p className="text-sm text-[#666] mt-1">Social Media Audit Report</p>
                <p className="text-xs text-[#666] mt-1">
                  Generated{' '}
                  {new Date(report.generatedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ScoreGauge score={report.overallScore} />
                <GradeBadge grade={getGrade(report.overallScore)} />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-6">
              <p className="text-sm text-[#B0B8C8] leading-relaxed">{report.summary}</p>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Profile Completeness', val: report.scores.profileCompleteness },
                { label: 'Content Consistency', val: report.scores.contentConsistency },
                { label: 'Engagement Rate', val: report.scores.engagementRate },
                { label: 'Growth Potential', val: report.scores.growthPotential },
                { label: 'Brand Presence', val: report.scores.brandPresence },
              ].map(s => (
                <div key={s.label} className="bg-[#0F0F1A] border border-[#1E1E35] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-poppins text-white">{s.val}</p>
                  <p className="text-[10px] text-[#666] mt-1 leading-tight">{s.label}</p>
                  <div className="mt-2 h-1 rounded-full bg-[#1E1E35]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.val}%`,
                        background: s.val >= 70 ? '#10B981' : s.val >= 45 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Sections */}
            {Object.entries(report.platforms || {}).map(([platform, info]) => {
              const Icon = PLATFORM_ICONS[platform]
              const color = PLATFORM_COLORS[platform]
              return (
                <div key={platform} className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon size={20} style={{ color }} />}
                      <h3 className="text-base font-bold font-poppins capitalize">{platform}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono" style={{ color }}>{info.score}/100</span>
                      <GradeBadge grade={info.grade} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-3 flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Strengths
                      </p>
                      <ul className="space-y-2">
                        {info.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-[#B0B8C8] leading-relaxed">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#EF4444] mb-3 flex items-center gap-1.5">
                        <XCircle size={12} /> Weaknesses
                      </p>
                      <ul className="space-y-2">
                        {info.weaknesses.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-[#B0B8C8] leading-relaxed">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35] mb-3 flex items-center gap-1.5">
                        <Zap size={12} /> Quick Wins
                      </p>
                      <ul className="space-y-2">
                        {info.quickWins.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-[#B0B8C8] leading-relaxed">{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Top Issues */}
            <div className="bg-[#0F0F1A] border border-[#EF4444]/40 rounded-2xl p-6">
              <h3 className="text-sm font-bold font-poppins text-[#EF4444] mb-4 uppercase tracking-widest">
                Top Critical Issues
              </h3>
              <ol className="space-y-2">
                {report.topIssues.slice(0, 5).map((issue, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="text-[#B0B8C8]">{issue}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 30-Day Action Plan */}
            <div>
              <h3 className="text-base font-bold font-poppins mb-4">30-Day Action Plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['week1', 'week2', 'week3', 'week4'].map((week, i) => (
                  <div key={week} className="bg-[#0F0F1A] border border-[#1E1E35] rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35] mb-3">Week {i + 1}</p>
                    <ul className="space-y-2">
                      {(report.thirtyDayActionPlan as any)[week]?.map((action: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-[#B0B8C8]">
                          <input type="checkbox" className="mt-0.5 flex-shrink-0 accent-[#FF6B35]" readOnly />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Benchmarks */}
            <div>
              <h3 className="text-base font-bold font-poppins mb-4">Industry Benchmarks</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Engagement Rate', value: report.industryBenchmark?.engagementRate },
                  { label: 'Posting Frequency', value: report.industryBenchmark?.postingFrequency },
                  { label: 'Follower Growth', value: report.industryBenchmark?.followerGrowthRate },
                ].map(b => (
                  <div key={b.label} className="bg-[#0F0F1A] border border-[#1E1E35] rounded-xl p-4 text-center">
                    <p className="text-[10px] text-[#666] uppercase tracking-widest mb-2">{b.label}</p>
                    <p className="text-sm font-bold font-poppins text-white">{b.value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Advantages */}
            {report.competitiveAdvantages?.length > 0 && (
              <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-xl p-5">
                <h3 className="text-sm font-bold font-poppins mb-3">Competitive Advantages</h3>
                <ul className="space-y-2">
                  {report.competitiveAdvantages.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#B0B8C8]">
                      <span className="text-[#10B981]">★</span>
                      {adv}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}