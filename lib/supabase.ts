import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const FALLBACK_SUPABASE_URL = 'https://example.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'demo-anon-key'

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

// Safe default for non-server UI paths during build-time static analysis.
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())

// Create a Supabase client for server-side operations
export const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Create a Supabase client for admin operations (with service role key)
export const createSupabaseAdminClient = () => {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey)
}