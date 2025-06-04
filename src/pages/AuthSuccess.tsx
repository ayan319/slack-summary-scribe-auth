
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamName = searchParams.get('team');

  useEffect(() => {
    // Auto-redirect to main app after 3 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

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
          You'll be redirected to the app in a few seconds...
        </p>
        <Button 
          onClick={() => navigate('/')}
          className="w-full"
        >
          Continue to App
        </Button>
      </div>
    </div>
  );
};

export default AuthSuccess;
