'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Rocket, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PublicReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('audits')
        .select('*')
        .eq('share_id', id as string)
        .single();
      
      if (data) setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#080812] flex items-center justify-center text-white font-poppins">Loading Report...</div>;
  if (!report) return <div className="min-h-screen bg-[#080812] flex flex-col items-center justify-center text-white font-poppins gap-4">
    <p>Report Not Found</p>
    <Link href="/" className="text-primary text-sm hover:underline">Return to Home</Link>
  </div>;

  return (
    <div className="min-h-screen bg-[#080812] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black">Social<span className="text-[#FF6B35]">Setu</span> Audit</h1>
          <div className="bg-[#FF6B35] px-4 py-2 rounded-full text-sm font-bold">Score: {report.scores?.overall || 0}</div>
        </div>
        
        <div className="bg-[#0F0F1A] border border-[#1E1E35] rounded-3xl p-10 mb-8">
          <h2 className="text-2xl font-bold mb-4">Analysis for {report.client_name}</h2>
          <p className="text-gray-400 mb-8">{report.report?.summary}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <h3 className="flex items-center gap-2 text-red-500 font-bold mb-3"><AlertCircle size={18}/> Critical Issues</h3>
              <ul className="text-sm space-y-2 opacity-80">
                {report.report?.topIssues?.slice(0, 3).map((issue: string, i: number) => <li key={i}>• {issue}</li>)}
              </ul>
            </div>
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col justify-center items-center text-center">
              <Rocket className="text-green-500 mb-2" />
              <h3 className="font-bold">Ready to fix these?</h3>
              <button className="mt-4 bg-[#FF6B35] px-6 py-2 rounded-xl font-bold text-sm">Book Strategy Call</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}