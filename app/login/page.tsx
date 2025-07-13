'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Github, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: userLoading } = useUser()

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!userLoading && user) {
      const redirectPath = searchParams.get('redirect') || '/dashboard'
      router.replace(redirectPath)
    }
  }, [user, userLoading, router, searchParams])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide more specific error messages
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment before trying again.'
        }

        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      if (data.user && data.session) {
        // Ensure user record exists in our users table (non-blocking)
        try {
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          if (upsertError) {
            // Log error but don't block login flow
            // Log error for debugging in development only
            if (process.env.NODE_ENV === 'development') {
              console.warn('Could not upsert user record (non-blocking):', upsertError)
            }
            // Show a non-blocking toast notification
            toast.warning('Profile sync in progress...', {
              description: 'Your profile will be updated shortly.'
            })
          } else {
            // Success - user record created/updated
            toast.success('Successfully signed in!', {
              description: 'Welcome back to your dashboard.'
            })
          }
        } catch (error) {
          // Catch any network or other errors - don't block login
          // Log error for debugging in development only
          if (process.env.NODE_ENV === 'development') {
            console.warn('User profile sync error (non-blocking):', error)
          }
          toast.info('Signed in successfully', {
            description: 'Profile sync will complete in the background.'
          })
        }

        // Get redirect path from URL params or default to dashboard
        const redirectPath = searchParams.get('redirect') || '/dashboard'

        toast.success('Successfully signed in!')

        // Use replace to prevent back button issues
        router.replace(redirectPath)
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'slack') => {
    setLoading(true)
    setError('')

    try {
      // Get redirect path for OAuth callback
      const redirectPath = searchParams.get('redirect') || '/dashboard'
      const redirectTo = `${window.location.origin}${redirectPath}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      })

      if (error) {
        const errorMessage = `Failed to sign in with ${provider}. Please try again.`
        setError(errorMessage)
        toast.error(errorMessage)
        setLoading(false)
      }
      // OAuth redirect will handle navigation
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during OAuth login.'
      setError(errorMessage)
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  // Show loading while checking auth state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your SummaryAI account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                aria-describedby="email-error"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                aria-describedby="password-error"
              />
            </div>
            <Button
              type="submit"
              className="w-full transition-all duration-200 hover:scale-[1.02]"
              disabled={loading}
              aria-label="Sign in with email and password"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="w-full"
              aria-label="Sign in with Google"
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className="w-full"
              aria-label="Sign in with GitHub"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('slack')}
              disabled={loading}
              className="w-full"
              aria-label="Sign in with Slack"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
              Slack
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:underline">
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
