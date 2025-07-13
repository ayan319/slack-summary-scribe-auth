'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export default function AuthGuard({
  children,
  redirectTo = '/login',
  fallback
}: AuthGuardProps) {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for auth state to be determined
    if (!userLoading) {
      setIsLoading(false)
    }
  }, [userLoading])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  // Show loading state while determining auth status
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    )
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      )
    )
  }

  // User is authenticated, render children
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
