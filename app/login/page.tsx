'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      router.push('/crm');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080812] text-text font-inter p-6">
      <div className="w-full max-w-md bg-[#0F0F1A] border border-[#1E1E35] p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 font-poppins">SocialSetu Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-xl p-3 outline-none focus:border-primary/50 text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-xl p-3 outline-none focus:border-primary/50 text-white"
            required
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="text-right">
            <span className="text-sm text-text hover:text-primary cursor-pointer">Forgot password?</span>
          </div>
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
