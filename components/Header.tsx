import React from 'react'
import { Upload } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    checkUser()
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="container flex min-h-16 items-center justify-between py-2">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="SwimFlow.ai Home" width={320} height={64} style={{ width: 'auto' }} className="h-14 w-auto object-contain md:h-16" priority />
          </Link>
          <nav className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Dashboard
            </a>
            <a href="/dashboard#active-meets" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Meets
            </a>
            <a href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Upload
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            // User is logged in - show avatar and dropdown
            <div className="relative">
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                <span>{user.email}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            // User is not logged in - show login/signup buttons
            <>
              <a href="/login" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">Log In</a>
              <a href="/signup" className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002878]">Sign Up</a>
            </>
          )}
          <a href="/dashboard" className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:flex">
            <Upload size={16} />
            Import
          </a>
          <a href="/dashboard" className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002878]">Create Meet</a>
        </div>
      </div>
    </header>
  )
}
