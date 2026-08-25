'use client'

import { Building2, Check, Eye, EyeOff, Lock, Mail, User, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

type Role = 'meet_host' | 'coach'

const roleOptions: Array<{ value: Role; title: string; description: string; icon: typeof Building2 }> = [
  {
    value: 'meet_host',
    title: 'Meet Host / Director',
    description: 'Host meets, manage seedings, publish live portal',
    icon: Building2,
  },
  {
    value: 'coach',
    title: 'Team Coach',
    description: 'Manage team rosters, entries, and swimmer stats',
    icon: Users,
  },
]

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('meet_host')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) router.replace('/dashboard')
    }

    void checkUser()
  }, [router])

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (authData.user && authData.session) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
        }, { onConflict: 'id' })

      if (profileError) {
        setError(`Your account was created, but profile setup failed: ${profileError.message}`)
        setLoading(false)
        return
      }

      router.replace('/dashboard')
      return
    }

    setNotice('Check your inbox to confirm your account, then return here to sign in.')
    setLoading(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl sm:p-10" aria-labelledby="signup-title">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="SwimFlow.ai Logo" width={200} height={40} className="mb-5 h-auto w-auto" priority />
          <h1 id="signup-title" className="text-2xl font-semibold text-slate-900">Get started with SwimFlow</h1>
          <p className="mt-2 text-sm text-slate-600">Create your account to set up and run your next meet.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSignup}>
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
          {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{notice}</p> : null}

          <div>
            <label htmlFor="full-name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Your name"
                disabled={loading}
              />
            </div>
          </div>

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
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="name@team.org"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Create a password"
                disabled={loading}
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

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">Choose your role</legend>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const Icon = option.icon
                const selected = role === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setRole(option.value)}
                    className={`relative min-h-40 rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${selected ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900' : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    <Icon size={20} className="mb-4 text-slate-700" aria-hidden="true" />
                    <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                    <span className="mt-2 block text-xs leading-5 text-slate-600">{option.description}</span>
                    {selected ? <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-white"><Check size={13} strokeWidth={3} aria-hidden="true" /></span> : null}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white shadow-md transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-slate-900 underline-offset-4 transition hover:underline">Sign in</Link>
        </p>
      </section>
    </div>
  )
}