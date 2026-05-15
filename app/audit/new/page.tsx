'use client'

import { Suspense, useState, useEffect } from 'react'
import { auditNewSchema } from '@/lib/validation/auditSchemas'
import { zodErrorToFieldErrors } from '@/lib/validation/zod-errors'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  business: string
}

interface FormState {
  clientName: string
  industry: string
  targetAudience: string
  businessGoal: string
  leadId: string
  platforms: {
    youtube: string
    instagram: string
    twitter: string
    linkedin: string
    facebook: string
  }
}

const INDUSTRIES = [
  'Restaurant/Food',
  'Real Estate',
  'IT/SaaS',
  'D2C/eCommerce',
  'Healthcare',
  'Education',
  'Fashion',
  'Other',
]

const BUSINESS_GOALS = [
  'Brand Awareness',
  'Lead Generation',
  'Sales/Revenue',
  'Community Building',
  'Thought Leadership',
]

const PLATFORM_META = [
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    placeholder: '@brandname or channel URL',
    data: ['Subscriber count', 'Video count', 'Avg. views', 'Upload frequency', 'Engagement rate'],
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
    placeholder: '@username',
    data: ['Follower count', 'Post count', 'Engagement rate', 'Business account check', 'Bio completeness'],
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    placeholder: '@handle',
    data: ['Follower count', 'Tweet count', 'Profile completeness', 'Verification status'],
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    placeholder: 'company/your-company-name',
    data: ['Follower count', 'Post frequency', 'Company size indicator'],
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    placeholder: 'facebook.com/pagename',
    data: ['Page likes', 'Post reach', 'Engagement metrics'],
  },
]

export default function NewAuditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080812]" />}>
      <NewAuditForm />
    </Suspense>
  )
}

function NewAuditForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [auditId, setAuditId] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})


  const leadIdFromUrl = searchParams.get('leadId') || ''
  const nameFromUrl = searchParams.get('name') || ''
  const industryFromUrl = searchParams.get('industry') || ''

  const [form, setForm] = useState<FormState>({
    clientName: nameFromUrl,
    industry: industryFromUrl,
    targetAudience: '',
    businessGoal: '',
    leadId: leadIdFromUrl,
    platforms: {
      youtube: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      facebook: '',
    },
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('leads')
      .select('id, name, business')
      .order('created_at', { ascending: false })
      .then(({ data }) => setLeads(data || []))
  }, [])

  const setPlatform = (key: keyof FormState['platforms'], value: string) =>
    setForm(prev => ({ ...prev, platforms: { ...prev.platforms, [key]: value } }))

  const hasAtLeastOnePlatform = Object.values(form.platforms).some(v => v.trim())

  const validateField = (field: string, value: any) => {
    const nextForm = { ...form };
    if (field.startsWith('platforms.')) {
      const platform = field.split('.')[1] as keyof FormState['platforms'];
      nextForm.platforms = { ...form.platforms, [platform]: value };
    } else {
      (nextForm as any)[field] = value;
    }

    return auditNewSchema.safeParse({
      clientName: nextForm.clientName,
      industry: nextForm.industry,
      targetAudience: nextForm.targetAudience,
      businessGoal: nextForm.businessGoal,
      leadId: nextForm.leadId,
      platforms: nextForm.platforms,
    })
  }

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('platforms.')) {
      const platform = field.split('.')[1] as keyof FormState['platforms'];
      setPlatform(platform, value);
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
    
    const r = validateField(field, value);
    setFieldErrors(r.success ? {} : zodErrorToFieldErrors(r.error));
    setError('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const result = auditNewSchema.safeParse({
      clientName: form.clientName,
      industry: form.industry,
      targetAudience: form.targetAudience,
      businessGoal: form.businessGoal,
      leadId: form.leadId,
      platforms: form.platforms,
    })

    if (!result.success) {
      setFieldErrors(zodErrorToFieldErrors(result.error))
      setError('Please fix the highlighted fields')
      return
    }

    setSubmitting(true)


    try {
      const cleanPlatforms: Record<string, string> = {}
      for (const [key, val] of Object.entries(form.platforms)) {
        if (val.trim()) cleanPlatforms[key] = val.trim()
      }

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          industry: form.industry,
          targetAudience: form.targetAudience,
          businessGoal: form.businessGoal,
          leadId: form.leadId || undefined,
          platforms: cleanPlatforms,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to start audit')
        return
      }

      setAuditId(data.auditId)
      window.location.href = `/audit/${data.auditId}`
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080812] text-white">

      {/* Header */}
      <div className="border-b border-[#1E1E35] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/crm')}
          className="flex items-center gap-2 text-[#666] hover:text-white transition-all text-sm"
        >
          <ArrowLeft size={16} />
          Back to CRM
        </button>
        <div className="h-4 w-px bg-[#1E1E35]" />
        <h1 className="text-sm font-bold text-white">New Social Media Audit</h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1 — Client Details */}
              <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-6 space-y-5">
                <h2 className="text-base font-bold font-poppins text-white">Client Details</h2>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666] mb-2">
                    Client Name <span className="text-[#FF6B35]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={e => handleChange('clientName', e.target.value)}
                    placeholder="e.g. The Bombay Burger Co."
                    className={`w-full bg-[#1A1A2E] border rounded-xl p-3 text-sm text-white placeholder-[#4A4A6A] outline-none focus:border-primary/50 transition-all ${fieldErrors.clientName ? 'border-[#EF4444]' : 'border-[#2A2A45]'}`}
                    required
                  />
                  {fieldErrors.clientName && (
                    <p className="text-[#EF4444] text-xs mt-1">{fieldErrors.clientName}</p>
                  )}

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#666] mb-2">
                      Industry
                    </label>
                    <select
                      value={form.industry}
                      onChange={e => handleChange('industry', e.target.value)}
                      className={`w-full bg-[#1A1A2E] border rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all ${fieldErrors.industry ? 'border-[#EF4444]' : 'border-[#2A2A45]'}`}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    {fieldErrors.industry && (
                      <p className="text-[#EF4444] text-[10px] mt-1">{fieldErrors.industry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#666] mb-2">
                      Business Goal
                    </label>
                    <select
                      value={form.businessGoal}
                      onChange={e => handleChange('businessGoal', e.target.value)}
                      className={`w-full bg-[#1A1A2E] border rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all ${fieldErrors.businessGoal ? 'border-[#EF4444]' : 'border-[#2A2A45]'}`}
                    >
                      <option value="">Select goal</option>
                      {BUSINESS_GOALS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {fieldErrors.businessGoal && (
                      <p className="text-[#EF4444] text-[10px] mt-1">{fieldErrors.businessGoal}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666] mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={form.targetAudience}
                    onChange={e => handleChange('targetAudience', e.target.value)}
                    placeholder="e.g. 25-40 year old urban professionals in Mumbai"
                    className={`w-full bg-[#1A1A2E] border rounded-xl p-3 text-sm text-white placeholder-[#4A4A6A] outline-none focus:border-primary/50 transition-all ${fieldErrors.targetAudience ? 'border-[#EF4444]' : 'border-[#2A2A45]'}`}
                  />
                  {fieldErrors.targetAudience && (
                    <p className="text-[#EF4444] text-[10px] mt-1">{fieldErrors.targetAudience}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#666] mb-2">
                    Link to CRM Lead
                  </label>
                  <select
                    value={form.leadId}
                    onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))}
                    className="w-full bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-3 text-sm text-white outline-none focus:border-[#FF6B35]/50 transition-all"
                  >
                    <option value="">None</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} — {l.business}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2 — Social Media Handles */}
              <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-6 space-y-5">
                <h2 className="text-base font-bold font-poppins text-white">Social Media Handles</h2>

                <div className="space-y-4">
                  {PLATFORM_META.map(({ key, label, icon: Icon, color, placeholder }) => (
                    <div key={key}>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#666] mb-2">
                        <Icon size={14} style={{ color }} />
                        {label}
                      </label>
                      <input
                        type="text"
                        value={form.platforms[key as keyof typeof form.platforms]}
                        onChange={e => handleChange(`platforms.${key}`, e.target.value)}
                        placeholder={placeholder}
                        className={`w-full bg-[#1A1A2E] border rounded-xl p-3 text-sm text-white placeholder-[#4A4A6A] outline-none focus:border-primary/50 transition-all ${fieldErrors.platforms ? 'border-[#EF4444]' : 'border-[#2A2A45]'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-[#1A1A2E] border border-[#2A2A45] rounded-xl p-4 flex items-start gap-3">
                  <span className="text-[#FF6B35] mt-0.5">ℹ️</span>
                  <p className="text-xs text-[#666] leading-relaxed">
                    Only public profiles can be analyzed. YouTube and Instagram give the most complete data.
                  </p>
                </div>
              </div>

              {/* Section 3 — Submit */}
              {error && (
                <div className="bg-[#2D1515] border border-[#5C2020] rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle size={16} className="text-[#f87171] flex-shrink-0" />
                  <p className="text-sm text-[#f87171]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
                style={{ background: submitting ? '#2A2A45' : '#FF6B35' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    Start Audit →
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right sidebar — platform checklist */}
          <div className="space-y-4">
            <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-4">
                What We Analyze
              </h3>
              <div className="space-y-4">
                {PLATFORM_META.map(({ key, label, icon: Icon, color, data }) => (
                  <div key={key} className="flex gap-3">
                    <div className="mt-0.5">
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">{label}</p>
                      <ul className="space-y-0.5">
                        {data.map(d => (
                          <li key={d} className="flex items-center gap-1.5 text-[10px] text-[#666]">
                            <CheckCircle2 size={10} className="text-[#10B981]" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-3">
                How It Works
              </h3>
              <ol className="space-y-2">
                {[
                  'Enter client social handles',
                  'We fetch public data in real-time',
                  'AI analyzes all platforms',
                  'You get a full branded report',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#666]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}