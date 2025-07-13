'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/user-context'

/**
 * AuthRedirect Component
 * 
 * Handles automatic redirects based on authentication state:
 * - Redirects authenticated users away from auth pages (/login, /signup)
 * - Redirects unauthenticated users to login from protected pages
 */
export default function AuthRedirect() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // Define auth pages that authenticated users shouldn't access
    const authPages = ['/login', '/signup', '/forgot-password', '/reset-password']
    
    // Define public pages that don't require authentication
    const publicPages = ['/', '/pricing', '/support', '/terms', '/privacy']
    
    const isAuthPage = authPages.includes(pathname)
    const isPublicPage = publicPages.includes(pathname)

    if (user && isAuthPage) {
      // User is logged in but on an auth page - redirect to dashboard
      router.replace('/dashboard')
    } else if (!user && !isAuthPage && !isPublicPage) {
      // User is not logged in and on a protected page - redirect to login
      const redirectUrl = encodeURIComponent(pathname)
      router.replace(`/login?redirect=${redirectUrl}`)
    }
  }, [user, isLoading, pathname, router])

  // This component doesn't render anything
  return null
}
