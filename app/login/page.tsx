'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Chrome, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signInWithOAuth, signInWithEmail, signUpWithEmail, getCurrentUser, resendVerification } from '@/lib/auth';
import { AuthLoadingSkeleton } from '@/components/skeletons/AuthSkeleton';

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'email' | 'resend' | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleOAuthSignIn = async (provider: 'google') => {
    setLoading(provider);
    setError('');
    setSuccess('');

    try {
      await signInWithOAuth(provider);
      // The OAuth flow will redirect to the callback page
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setError(error instanceof Error ? error.message : `Failed to sign in with ${provider}`);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(null);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(null);
      return;
    }

    if (isSignUp && !formData.name) {
      setError('Please enter your name');
      setLoading(null);
      return;
    }

    try {
      if (isSignUp) {
        const { user } = await signUpWithEmail(formData.email, formData.password, formData.name);
        if (user && !user.email_confirmed_at) {
          setSuccess('Please check your email to confirm your account before signing in.');
        } else {
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } else {
        await signInWithEmail(formData.email, formData.password);
        setSuccess('Signed in successfully! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (error) {
      console.error('Email auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);

      // Show resend verification option if email not confirmed
      if (errorMessage.includes('confirmation link') || errorMessage.includes('Email not confirmed')) {
        setShowResendVerification(true);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading('resend');
    setError('');
    setSuccess('');

    try {
      await resendVerification(formData.email);
      setSuccess('Verification email sent! Please check your inbox and click the confirmation link.');
      setShowResendVerification(false);
    } catch (error) {
      console.error('Resend verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setLoading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (checkingAuth) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to Slack Summary Scribe
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Create your account to get started' : 'Sign in to your account to get started'}
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Create a new account' : 'Choose your preferred sign-in method'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {showResendVerification && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={loading !== null}
                        className="text-xs"
                      >
                        {loading === 'resend' ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Resend Verification Email'
                        )}
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading !== null}
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading !== null}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading !== null}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading !== null}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading !== null}
                className="w-full h-12 text-base"
              >
                {loading === 'email' ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading !== null}
              variant="outline"
              className="w-full h-12 text-base"
            >
              {loading === 'google' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <Chrome className="h-5 w-5 mr-3" />
                  Continue with Google
                </>
              )}
            </Button>



            {/* Toggle Sign In/Sign Up */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                  setShowResendVerification(false);
                  setFormData({ email: '', password: '', name: '' });
                }}
                className="text-sm text-blue-600 hover:text-blue-500 underline"
                disabled={loading !== null}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                By {isSignUp ? 'signing up' : 'signing in'}, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            What you'll get:
          </h3>
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI-powered Slack conversation summaries</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Team collaboration and organization management</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Secure data handling and privacy protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
