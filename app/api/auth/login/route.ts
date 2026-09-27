import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const redirectToLogin = (request: NextRequest, message: string) => {
  const url = new URL('/login', request.url)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url, 303)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return redirectToLogin(request, 'Enter your email address and password.')
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url), 303)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return redirectToLogin(request, 'Invalid email or password.')
    return response
  } catch {
    return redirectToLogin(request, 'Unable to sign in right now. Please try again.')
  }
}