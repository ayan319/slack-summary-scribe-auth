
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamName = searchParams.get('team');

  useEffect(() => {
    // Auto-redirect to main app after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Successfully Connected!
        </h1>
        <p className="text-gray-600 mb-4">
          {teamName ? `Connected to ${teamName}` : 'Your Slack workspace has been connected'}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You can now test the integration or return to the main app.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/slack-test')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Test Slack Integration
          </Button>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            Return to App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
