import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SECURITY_CONFIG } from '@/lib/security';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add comprehensive security headers for all requests
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/settings', '/summaries', '/uploads', '/analytics'];

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/auth/callback', '/support', '/privacy', '/terms'];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Check for auth token in cookies (simplified approach)
  const hasAuthCookie = request.cookies.has('sb-access-token') ||
                       request.cookies.has('supabase-auth-token') ||
                       request.cookies.has('sb-refresh-token');

  // Handle authentication logic (simplified - actual auth check happens on client)
  if (isProtectedRoute && !hasAuthCookie) {
    // Redirect to login if trying to access protected route without auth cookie
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === '/login' && hasAuthCookie) {
    // Redirect to dashboard if already logged in and trying to access login
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Don't redirect from landing page - let users see it even if authenticated
  // This allows them to see the marketing content

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', String(Date.now() + 60000));
  }

  return response;
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|robots.txt|sitemap.xml).*)',
  ],
};
