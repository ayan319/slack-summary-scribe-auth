
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SlackOAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`OAuth error: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('Authorization code not received');
          setLoading(false);
          return;
        }

        console.log('Handling OAuth callback with code:', code?.substring(0, 10) + '...');

        // Call the OAuth callback edge function
        const { data, error: callbackError } = await supabase.functions.invoke('slack-oauth-callback', {
          method: 'POST',
          body: JSON.stringify({ code, state })
        });

        if (callbackError) {
          console.error('OAuth callback error:', callbackError);
          setError(`Failed to complete OAuth: ${callbackError.message}`);
          setLoading(false);
          return;
        }

        console.log('OAuth callback successful:', data);
        
        // Redirect to success page
        const teamName = data?.team?.name || 'your workspace';
        navigate(`/auth/success?team=${encodeURIComponent(teamName)}`);
        
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting to Slack...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Please wait while we complete your Slack workspace connection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Connection Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default SlackOAuthCallback;
