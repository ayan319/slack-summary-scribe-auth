
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, TestTube } from 'lucide-react';

const SlackTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const testSlackConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing Slack connection...');
      const { data, error } = await supabase.functions.invoke('slack-test', {
        body: { action: 'test_auth' }
      });

      if (error) throw error;

      console.log('Test result:', data);
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Success!",
          description: "Slack API connection test completed successfully",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to test Slack connection",
        suggestion: "Please check your Slack integration and try again"
      };
      setResult(errorResult);
      toast({
        title: "Error",
        description: "Failed to test Slack connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Slack Integration Test</h1>
            <p className="text-gray-600">Test your Slack OAuth connection and view team information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Test Slack API Connection</span>
              </CardTitle>
              <CardDescription>
                This will verify if your Slack OAuth tokens are working properly and display your team information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testSlackConnection}
                disabled={loading}
                className="w-full mb-4"
                size="lg"
              >
                {loading ? 'Testing Connection...' : 'Test Slack Connection'}
              </Button>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>What this test does:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Checks if Slack tokens are stored in the database</li>
                  <li>Validates tokens with Slack's API</li>
                  <li>Retrieves team and user information</li>
                  <li>Displays connection status and details</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {result?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : result && !result.success ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <TestTube className="h-5 w-5 text-gray-400" />
                )}
                <span>Test Results</span>
              </CardTitle>
              <CardDescription>
                Connection status and team information will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Click "Test Slack Connection" to run the test</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.success ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Connection Successful!</h4>
                        <p className="text-green-700">{result.message}</p>
                      </div>
                      
                      {result.team && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Team Information:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div><strong>Team Name:</strong> {result.team.name}</div>
                            <div><strong>Team ID:</strong> {result.team.id}</div>
                            <div><strong>User:</strong> {result.team.user}</div>
                            <div><strong>User ID:</strong> {result.team.user_id}</div>
                          </div>
                        </div>
                      )}
                      
                      {result.token_info && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Token Information:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div><strong>Workspace:</strong> {result.token_info.team_name}</div>
                            <div><strong>Scopes:</strong> {result.token_info.scopes}</div>
                            <div><strong>Connected:</strong> {new Date(result.token_info.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">❌ Connection Failed</h4>
                        <p className="text-red-700">{result.error}</p>
                        {result.suggestion && (
                          <p className="text-red-600 mt-2 text-sm">
                            <strong>Suggestion:</strong> {result.suggestion}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">What to do next:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Make sure you've connected your Slack workspace</li>
                          <li>Try disconnecting and reconnecting your workspace</li>
                          <li>Check if your Slack app permissions are correct</li>
                        </ul>
                        <Button 
                          onClick={() => navigate('/')}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          Connect Slack Workspace
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SlackTest;
