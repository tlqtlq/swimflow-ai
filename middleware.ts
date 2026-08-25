import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!user &&
      (request.nextUrl.pathname.startsWith('/dashboard') ||
       request.nextUrl.pathname.startsWith('/meets/new') ||
       request.nextUrl.pathname.includes('/meets/') && request.nextUrl.pathname.includes('/manage'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }
  
  // If user is authenticated as a spectator and tries to access protected routes, redirect to home
  if (user) {
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!error && userProfile?.role === 'spectator') {
      // If trying to access dashboard or meet creation routes, redirect to home
      if (request.nextUrl.pathname.startsWith('/dashboard') ||
          request.nextUrl.pathname.startsWith('/meets/new') ||
          request.nextUrl.pathname.includes('/meets/') && request.nextUrl.pathname.includes('/manage')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        const redirect = NextResponse.redirect(url)
        response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
        return redirect
      }
    }
  }
  
  // Allow access to public routes (including portal routes for spectators)
  if (request.nextUrl.pathname.startsWith('/portal/')) {
    return NextResponse.next()
  }
  
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/meets/new',
    '/meets/:path*/manage',
    '/portal/:path*'
  ]
}