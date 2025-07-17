'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { Loader2, AlertCircle } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

// Production-ready AuthGuard with robust error handling and infinite redirect prevention
export default function AuthGuard({
  children,
  redirectTo = '/login',
  fallback
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  // State for error handling and redirect prevention
  const [hasRedirected, setHasRedirected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const redirectAttempts = useRef(0)
  const maxRedirectAttempts = 3
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null)

  // Enhanced redirect logic with infinite loop prevention
  useEffect(() => {
    // Reset redirect attempts when user state changes (successful authentication)
    if (isAuthenticated) {
      // Reset all redirect state upon successful authentication
      redirectAttempts.current = 0
      setHasRedirected(false)
      setError(null)

      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 AuthGuard: Authentication successful, reset redirect state');
      }

      // Clear any pending redirect timeout
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
        redirectTimeout.current = null
      }
      return
    }

    // Prevent infinite redirects - limit to 3 attempts
    if (hasRedirected || redirectAttempts.current >= maxRedirectAttempts) {
      if (redirectAttempts.current >= maxRedirectAttempts) {
        setError('Authentication check failed. Please refresh the page.')
        if (process.env.NODE_ENV === 'development') {
          console.error(`🔒 AuthGuard: Max redirect attempts (${maxRedirectAttempts}) reached, stopping redirects to prevent infinite loops`);
        }
      }
      return
    }

    // Don't redirect if already on the login page
    if (pathname === '/login' || pathname.startsWith('/login')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 AuthGuard: Already on login page, skipping redirect');
      }
      return
    }

    // Only redirect when we're certain there's no authenticated user and not loading
    if (!isLoading && !isAuthenticated) {
      try {
        redirectAttempts.current += 1
        setHasRedirected(true)

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔒 AuthGuard: Redirecting unauthenticated user to login (attempt ${redirectAttempts.current})`);
        }

        // Use relative redirect: router.push("/login") to avoid protocol issues
        router.push("/login")

        // Set a timeout to reset redirect state if navigation doesn't complete
        redirectTimeout.current = setTimeout(() => {
          if (hasRedirected && !isAuthenticated) {
            setError('Navigation is taking longer than expected. Please refresh the page.')
            if (process.env.NODE_ENV === 'development') {
              console.warn('🔒 AuthGuard: Redirect timeout, resetting state');
            }
          }
        }, 5000) // 5 second timeout

      } catch (redirectError) {
        setError('Navigation failed. Please try refreshing the page.')
        if (process.env.NODE_ENV === 'development') {
          console.error('🔒 AuthGuard: Redirect failed:', redirectError);
        }
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo, pathname, hasRedirected])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
      }
    }
  }, [])

  // Show error state if authentication failed
  if (error) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Authentication Error</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-primary hover:underline"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    )
  }

  // Production-ready loading state with timeout protection
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      )
    )
  }

  // Show redirect state only if not already redirected and not on target page
  if (!isAuthenticated && !hasRedirected && pathname !== redirectTo) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      )
    )
  }

  // User is authenticated - render protected content
  return <>{children}</>
}

// Higher-order component version for easier usage
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string
    fallback?: React.ReactNode
  }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard 
        redirectTo={options?.redirectTo} 
        fallback={options?.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook for checking auth status in components
export function useAuthGuard() {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()

  const requireAuth = (redirectTo: string = '/login') => {
    if (!user) {
      router.push(redirectTo)
      return false
    }
    return true
  }

  const requireNoAuth = (redirectTo: string = '/dashboard') => {
    if (user) {
      router.push(redirectTo)
      return false
    }
    return true
  }

  return {
    user,
    isAuthenticated,
    requireAuth,
    requireNoAuth,
  }
}
