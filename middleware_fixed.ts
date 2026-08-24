import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if we're in a browser environment (middleware runs on server)
  if (typeof window !== 'undefined') {
    return NextResponse.next()
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )
    
    const { data: { session } } = await supabase.auth.getSession()
    
    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!session && 
        (request.nextUrl.pathname.startsWith('/dashboard') ||
         request.nextUrl.pathname.startsWith('/meets/new') ||
         request.nextUrl.pathname.includes('/meets/') && request.nextUrl.pathname.includes('/manage'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    // If user is authenticated as a spectator and tries to access protected routes, redirect to home
    if (session) {
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (!error && userProfile?.role === 'spectator') {
        // If trying to access dashboard or meet creation routes, redirect to home
        if (request.nextUrl.pathname.startsWith('/dashboard') ||
            request.nextUrl.pathname.startsWith('/meets/new') ||
            request.nextUrl.pathname.includes('/meets/') && request.nextUrl.pathname.includes('/manage')) {
          const url = request.nextUrl.clone()
          url.pathname = '/'
          return NextResponse.redirect(url)
        }
      }
    }
    
    // Allow access to public routes (including portal routes for spectators)
    if (request.nextUrl.pathname.startsWith('/portal/')) {
      return NextResponse.next()
    }
    
    return NextResponse.next()
  } catch (error) {
    console.warn('Error in middleware:', error)
    // If there's an error in the middleware, allow access to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/meets/new',
    '/meets/:path*/manage',
    '/portal/:path*'
  ]
}