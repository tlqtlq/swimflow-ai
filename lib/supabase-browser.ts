'use client'

import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_SUPABASE_URL = 'https://example.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'demo-anon-key'

const getSupabaseBrowserClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY,
  )

export const supabase = getSupabaseBrowserClient()