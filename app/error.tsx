'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-lg w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Something went wrong!</CardTitle>
            <CardDescription>
              We encountered an unexpected error. Our team has been notified and is working to fix this issue.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isDevelopment && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-left">
                  <div className="font-mono text-xs">
                    <div className="font-semibold mb-1">Error:</div>
                    <div className="whitespace-pre-wrap">{error.message}</div>
                    {error.digest && (
                      <>
                        <div className="font-semibold mt-2 mb-1">Digest:</div>
                        <div>{error.digest}</div>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={reset} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/';
                    }
                  }}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard';
                  }
                }}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If this problem persists, please contact our support team.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.location.href = '/contact'}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.location.href = '/help'}
                  className="flex-1"
                >
                  Help Center
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t">
              <div>Error ID: {error.digest || 'Unknown'}</div>
              <div>Time: {new Date().toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
