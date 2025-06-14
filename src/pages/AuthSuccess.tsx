import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamName = searchParams.get('team');

  useEffect(() => {
    // Auto-redirect to dashboard after 10 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md border">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          🎉 Successfully Connected!
        </h1>
        <p className="text-gray-600 mb-2">
          {teamName ? `Connected to ${teamName}` : 'Your Slack workspace has been connected'}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          You can now access all the features of Slack Summarizer.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            onClick={() => navigate('/slack-test')}
            variant="outline"
            className="w-full"
          >
            Test Slack Integration
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 mt-6">
          You'll be automatically redirected to the dashboard in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default AuthSuccess;
