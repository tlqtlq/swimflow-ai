'use client'

import { ChevronDown, LayoutDashboard, LogOut, Upload } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-browser'

type ProfileRole = 'meet_host' | 'coach' | 'spectator'

const roleLabels: Record<ProfileRole, string> = {
  meet_host: 'Meet Host',
  coach: 'Team Coach',
  spectator: 'Spectator',
}

function isProfileRole(role: unknown): role is ProfileRole {
  return role === 'meet_host' || role === 'coach' || role === 'spectator'
}

function getUserRole(user: User | null): ProfileRole | null {
  const role = user?.user_metadata?.role
  return isProfileRole(role) ? role : null
}

function getInitials(email: string | undefined) {
  return email?.slice(0, 2).toUpperCase() || 'SF'
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<ProfileRole | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    let isActive = true

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (isActive) setUser(data.user)
    }

    void checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive) {
        setUser(session?.user ?? null)
        setMenuOpen(false)
      }
    })

    return () => {
      isActive = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isActive = true

    if (!user) {
      setRole(null)
      return () => {
        isActive = false
      }
    }

    setRole(getUserRole(user))

    const loadProfileRole = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (isActive && data && isProfileRole(data.role)) setRole(data.role)
    }

    void loadProfileRole()

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    if (!menuOpen) return

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }

    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [menuOpen])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) return

    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const closeMenuOnEscape = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="SwimFlow home">
            <Image src="/applogo.jpg" alt="SwimFlow.ai Home" width={320} height={64} style={{ width: 'auto' }} className="h-12 w-auto object-contain md:h-14" priority />
          </Link>
          {user ? (
            <nav className="hidden items-center gap-5 md:flex" aria-label="Application navigation">
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/dashboard#active-meets" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                Meets
              </Link>
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex">
                <Upload size={16} aria-hidden="true" />
                Import
              </Link>
              <Link href="/dashboard" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800">
                Create Meet
              </Link>
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  onClick={() => setMenuOpen((open) => !open)}
                  onKeyDown={closeMenuOnEscape}
                  className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white" aria-hidden="true">
                    {getInitials(user.email)}
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {menuOpen ? (
                  <div role="menu" className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-slate-900">{user.email}</p>
                      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {role ? roleLabels[role] : 'Member'}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <LayoutDashboard size={16} aria-hidden="true" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                Log In
              </Link>
              <Link href="/signup" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
