'use client'

import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const loginError = new URLSearchParams(window.location.search).get('error')
    if (loginError) setError(loginError)
  }, [])

  async function handlePasswordReset() {
    if (!email) {
      setError('Enter your email address first, then request a password reset.')
      return
    }

    setError(null)
    setNotice(null)
    setResettingPassword(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) setError(resetError.message)
    else setNotice('Password reset instructions have been sent to your email.')

    setResettingPassword(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl sm:p-10" aria-labelledby="login-title">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="SwimFlow.ai Logo" width={200} height={40} className="mb-5 h-auto w-auto" priority />
          <h1 id="login-title" className="text-2xl font-semibold text-slate-900">Welcome back to SwimFlow</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage your next meet.</p>
        </div>

        <form className="space-y-5" action="/api/auth/login" method="post">
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
          {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{notice}</p> : null}

          <div>
            <label htmlFor="email-address" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900"
                placeholder="name@team.org"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resettingPassword}
                className="text-sm font-medium text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resettingPassword ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white shadow-md transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Sign in
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          New to SwimFlow?{' '}
          <Link href="/signup" className="font-medium text-slate-900 underline-offset-4 transition hover:underline">Create an account</Link>
        </p>
      </section>
    </div>
  )
}