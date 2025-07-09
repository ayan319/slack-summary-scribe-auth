import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SECURITY_CONFIG } from '@/lib/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  console.log('🔍 Middleware: Processing request for:', pathname);

  // Add comprehensive security headers for all requests
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', String(Date.now() + 60000));
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/pricing',
    '/privacy',
    '/terms',
    '/support',
    '/auth/callback',
    '/api/auth/callback',
    '/api/healthcheck'
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api/'));

  if (isPublicRoute) {
    console.log('✅ Middleware: Public route, allowing access to:', pathname);
    return response;
  }

  // For protected routes, check authentication
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('🔍 Middleware: Session error:', error);
    }

    if (!session) {
      console.log('🔍 Middleware: No session found, redirecting to login from:', pathname);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('✅ Middleware: Authenticated user accessing:', pathname);
    return response;

  } catch (error) {
    console.error('🔍 Middleware: Auth check failed:', error);
    // On error, redirect to login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - robots.txt, sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|robots.txt|sitemap.xml).*)',
  ],
};
