'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Log to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', true);
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });

      if (typeof window !== 'undefined') {
        scope.setContext('browser', {
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      }

      Sentry.captureException(error);
    });

    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const copyErrorDetails = () => {
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        console.log('Error details copied to clipboard');
      })
      .catch(() => {
        console.error('Failed to copy error details');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600">
            We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error ID for support */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Error ID: <code className="font-mono text-xs bg-blue-100 px-1 rounded">{errorId}</code>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyErrorDetails}
                  className="h-6 px-2 text-blue-600 hover:text-blue-700"
                >
                  Copy Details
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Error message for development */}
          {isDevelopment && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details (Development)
                  </summary>
                  <div className="font-mono text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={retry}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
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

          {/* Help text */}
          <div className="text-center text-sm text-gray-500">
            <p>If this problem persists, please contact our support team</p>
            <p className="text-xs mt-1">
              Include the Error ID above for faster assistance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specific error fallbacks for different scenarios
export function AuthErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with authentication. Please try logging in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Go to Login
            </Button>
            <Button variant="outline" onClick={retry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function APIErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load data. Please try again.</span>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Hook for handling async errors in components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Async error caught:', error, errorInfo);
    
    // You can integrate with error reporting services here
    if (typeof window !== 'undefined') {
      console.error('Async error details:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  };
}
