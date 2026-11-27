'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { useBizPilot } from '@/src/context/BizPilotContext';
import { t } from '@/src/lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  verifiedData?: any;
}

export default function AssistantPage() {
  const { activeBusiness, lang } = useBizPilot();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: lang === 'mr'
        ? `नमस्कार! मी BizPilot AI, आपला व्यवसाय सहाय्यक. चालू महिन्याची विक्री, खर्च, नफा किंवा फॉलो-अप्स बद्दल काहीही विचारा.`
        : lang === 'hi'
        ? `नमस्ते! मैं BizPilot AI, आपका व्यावसायिक सहायक। इस महीने की बिक्री, खर्चे, मुनाफे या फॉलो-अप के बारे में कुछ भी पूछें।`
        : `Hello! I am BizPilot AI, your executive business copilot. Ask me anything about your verified sales, expenses, conversion rates, or today's follow-ups.`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    lang === 'mr' ? 'या महिन्यातील माझी एकूण विक्री आणि खर्च किती आहे?' : lang === 'hi' ? 'इस महीने मेरी कुल बिक्री और खर्चे कितने हैं?' : 'What are my total sales and expenses this month?',
    lang === 'mr' ? 'आज कोणाशी संपर्क साधायचा आहे?' : lang === 'hi' ? 'आज किसे फॉलो-अप कॉल करना है?' : 'Which leads need follow-up today?',
    lang === 'mr' ? 'व्यवसायाचा साप्ताहिक कामगिरी गोषवारा द्या' : lang === 'hi' ? 'साप्ताहिक व्यावसायिक प्रदर्शन का सारांश दें' : 'Give me a summary of my business performance',
    lang === 'mr' ? 'लीड रूपांतरण वाढवण्यासाठी काही उपाय सुचवा' : lang === 'hi' ? 'लीड रूपांतरण दर सुधारने के उपाय बताएं' : 'Suggest ways to improve my lead conversion',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || !activeBusiness?.id) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          message: textToSend,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process question');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          verifiedData: data.verifiedData,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Could not query telemetry. Please try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-5xl mx-auto flex flex-col bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white shadow-xs">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {t(lang, 'assistant.title')} — {activeBusiness?.name}
            </h2>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Grounded in Verified Financial Records (No Hallucinations)
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono font-bold">
          Gemini 3.8 Flash
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-100 text-slate-800 shadow-2xs'
              }`}
            >
              {m.content}

              {m.verifiedData && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                  <div>Sales: ₹{m.verifiedData.totalSalesMonth.toLocaleString('en-IN')}</div>
                  <div>Expenses: ₹{m.verifiedData.totalExpensesMonth.toLocaleString('en-IN')}</div>
                  <div>Net Profit: ₹{m.verifiedData.netProfitMonth.toLocaleString('en-IN')}</div>
                  <div>Leads: {m.verifiedData.totalLeads} ({m.verifiedData.conversionRate}% won)</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2563EB]" />
              <span>{t(lang, 'assistant.thinking')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
        <Lightbulb size={13} className="text-amber-500 flex-shrink-0" />
        <span className="text-slate-400 font-bold whitespace-nowrap">Suggested:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] whitespace-nowrap transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(lang, 'assistant.inputPlaceholder')}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send size={14} /> {t(lang, 'assistant.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
