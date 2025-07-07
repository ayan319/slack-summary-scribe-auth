'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react';

interface EmailVerificationBannerProps {
  userEmail: string;
  isVerified: boolean;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ 
  userEmail, 
  isVerified, 
  onDismiss 
}: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Don't show banner if email is verified or dismissed
  if (isVerified || dismissed) {
    return null;
  }

  const resendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Verification email sent! Check your inbox.');
        
        // Start cooldown
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setMessage('');
        }, 5000);
      } else {
        setError(data.message);
        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          setError('');
        }, 5000);
      }
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="mb-6">
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <div className="font-medium text-amber-800 dark:text-amber-200">
              Email verification required
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Please verify your email address ({userEmail}) to access all features.
            </div>
            
            {message && (
              <div className="flex items-center mt-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4 mr-1" />
                {message}
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-700 dark:text-red-300 mt-2">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={resendVerification}
              disabled={loading || cooldown > 0}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  Resend ({cooldown}s)
                </>
              ) : (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  Resend Email
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
