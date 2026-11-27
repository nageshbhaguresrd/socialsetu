'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Trash2,
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';

export default function MarketingStudioPage() {
  const { activeBusiness, lang, quota } = useBizPilot();

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'linkedin' | 'whatsapp'>('instagram');
  const [contentLang, setContentLang] = useState<'en' | 'hi' | 'mr' | 'hinglish'>(lang === 'mr' ? 'mr' : lang === 'hi' ? 'hi' : 'en');
  const [tone, setTone] = useState<'promotional' | 'professional' | 'friendly' | 'creative' | 'informative'>('promotional');
  const [targetAudience, setTargetAudience] = useState('');
  const [offerDetails, setOfferDetails] = useState('');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);

  const loadDrafts = async (bizId: string) => {
    try {
      const res = await fetch(`/api/marketing/contents?business_id=${bizId}`);
      const data = await res.json();
      if (data.contents) setSavedDrafts(data.contents);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      loadDrafts(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !topic.trim()) return;

    setGenerating(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          topic,
          platform,
          language: contentLang,
          tone,
          target_audience: targetAudience || undefined,
          offer_details: offerDetails || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setResult(data.content);
      loadDrafts(activeBusiness.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `${result.headline ? `${result.headline}\n\n` : ''}${result.caption}\n\n${(result.hashtags || []).map((h: string) => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!activeBusiness?.id) return;
    try {
      await fetch(`/api/marketing/contents?id=${draftId}`, { method: 'DELETE' });
      loadDrafts(activeBusiness.id);
    } catch (e) {
      console.error(e);
    }
  };

  const getPlatformIcon = (plt: string) => {
    switch (plt) {
      case 'instagram': return <Instagram size={16} className="text-pink-500" />;
      case 'facebook': return <Facebook size={16} className="text-blue-500" />;
      case 'linkedin': return <Linkedin size={16} className="text-sky-500" />;
      case 'whatsapp': return <MessageCircle size={16} className="text-emerald-500" />;
      default: return <Share2 size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="text-[#2563EB]" /> {t(lang, 'marketing.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t(lang, 'marketing.subtitle')}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Generator Controls */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t(lang, 'marketing.topicLabel')}
              </label>
              <textarea
                required
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t(lang, 'marketing.topicPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t(lang, 'marketing.platformLabel')}
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="whatsapp">WhatsApp Message</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t(lang, 'marketing.languageLabel')}
                </label>
                <select
                  value={contentLang}
                  onChange={(e) => setContentLang(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t(lang, 'marketing.toneLabel')}
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                >
                  <option value="promotional">Promotional</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="creative">Creative</option>
                  <option value="informative">Informative</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Audience (Optional)
                </label>
                <input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Local shop owners"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Offer / Discount Details (Optional)
              </label>
              <input
                value={offerDetails}
                onChange={(e) => setOfferDetails(e.target.value)}
                placeholder="e.g. Flat ₹500 off on first purchase above ₹2000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating Marketing Content...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> {t(lang, 'marketing.generateBtn')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Output Canvas */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  {getPlatformIcon(platform)} Platform: <b className="text-slate-800 capitalize">{platform}</b>
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : t(lang, 'marketing.copyBtn')}
                </button>
              </div>

              {result.headline && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    {t(lang, 'marketing.headline')}
                  </span>
                  <p className="text-sm font-bold text-slate-900">{result.headline}</p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Post Content
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {result.caption}
                </div>
              </div>

              {result.callToAction && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
                  <b>{t(lang, 'marketing.cta')}:</b> {result.callToAction}
                </div>
              )}

              {result.hashtags && result.hashtags.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {t(lang, 'marketing.hashtags')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hashtags.map((h: string) => (
                      <span key={h} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-[#2563EB] font-mono">
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.visualPrompt && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-purple-600">
                    {t(lang, 'marketing.visualPrompt')}
                  </span>
                  <p className="text-[11px] leading-relaxed">{result.visualPrompt}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Sparkles size={40} className="text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">AI Marketing Canvas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Fill in your promotion topic on the left to generate authentic, ready-to-publish Indian business copy in English, Hindi, or Marathi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Saved Drafts History Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          {t(lang, 'marketing.savedDrafts')} ({savedDrafts.length})
        </h3>

        {savedDrafts.length === 0 ? (
          <p className="text-xs text-slate-400">No saved drafts yet. Generate your first post above!</p>
        ) : (
          <div className="space-y-2">
            {savedDrafts.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-xs">
                    {getPlatformIcon(d.platform)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block capitalize">{d.topic}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(d.created_at).toLocaleDateString()} • {d.language.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDraft(d.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                  title="Delete Draft"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
