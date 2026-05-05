'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

const initialState = { error: '' }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080812] p-6">
      <div className="w-full max-w-md bg-[#0F0F1A] border border-[#1E1E35] p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">SocialSetu</h1>
        <p className="text-sm text-[#666] mb-8">Sign in to your CRM dashboard</p>
        <form action={formAction} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-xl p-3 outline-none focus:border-[#6C63FF]/50 text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full bg-[#1A1A2E] border border-[#1E1E35] rounded-xl p-3 outline-none focus:border-[#6C63FF]/50 text-white"
          />
          {state?.error && (
            <div className="bg-[#2D1515] border border-[#5C2020] rounded-lg p-3">
              <p className="text-[#f87171] text-sm">{state.error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: pending ? '#2A2A45' : '#6C63FF' }}
          >
            {pending ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  )
}