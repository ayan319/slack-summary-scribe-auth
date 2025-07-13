'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ArrowLeft,
  Slack
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SlackConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check for OAuth callback parameters
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      setMessage(`Slack authorization failed: ${error}`);
      return;
    }

    if (code) {
      handleSlackCallback(code, state);
    }
  }, [searchParams]);

  const handleSlackCallback = async (code: string, state: string | null) => {
    setIsProcessing(true);
    setStatus('connecting');
    setMessage('Processing Slack authorization...');

    try {
      const response = await fetch('/api/slack/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Successfully connected to Slack! Redirecting to dashboard...');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to connect to Slack');
      }
    } catch (error) {
      console.error('Slack callback error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred while connecting to Slack');
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateSlackConnection = async () => {
    setIsProcessing(true);
    setStatus('connecting');
    setMessage('Redirecting to Slack...');

    try {
      // Generate state parameter for security
      const state = btoa(JSON.stringify({
        timestamp: Date.now(),
        redirect: '/dashboard'
      }));

      // Build Slack OAuth URL
      const slackClientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
      const redirectUri = `${window.location.origin}/slack/connect`;
      const scopes = 'channels:read,chat:write,files:read,users:read,team:read';

      const oauthUrl = `https://slack.com/oauth/v2/authorize?` +
        `client_id=${slackClientId}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

      // Redirect to Slack OAuth
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Slack connection error:', error);
      setStatus('error');
      setMessage('Failed to initiate Slack connection');
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Slack className="h-8 w-8 text-purple-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-purple-200 bg-purple-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className={`${getStatusColor()} border-2`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              {status === 'idle' && 'Connect to Slack'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'success' && 'Connected!'}
              {status === 'error' && 'Connection Failed'}
            </CardTitle>
            <CardDescription>
              {status === 'idle' && 'Connect your Slack workspace to start generating AI-powered summaries'}
              {status === 'connecting' && 'Please wait while we connect your Slack workspace'}
              {status === 'success' && 'Your Slack workspace has been successfully connected'}
              {status === 'error' && 'There was an issue connecting your Slack workspace'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {message && (
              <Alert className={
                status === 'error' ? 'border-red-200 bg-red-50' :
                status === 'success' ? 'border-green-200 bg-green-50' :
                'border-blue-200 bg-blue-50'
              }>
                <AlertDescription className={
                  status === 'error' ? 'text-red-800' :
                  status === 'success' ? 'text-green-800' :
                  'text-blue-800'
                }>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status === 'idle' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">What you'll get:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>AI-powered conversation summaries</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Automatic channel monitoring</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Export to PDF, Excel, and Notion</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Smart notifications and insights</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={initiateSlackConnection}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Slack Workspace
                    </>
                  )}
                </Button>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            By connecting Slack, you agree to our{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-purple-600 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
