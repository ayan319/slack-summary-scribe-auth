
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SlackTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testSlackConnection = async () => {
    setLoading(true);
    try {
      // Call a test function to verify Slack API connection
      const { data, error } = await supabase.functions.invoke('slack-test', {
        body: { action: 'test_auth' }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success!",
        description: "Slack API connection test completed",
      });
    } catch (error) {
      console.error('Test failed:', error);
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Slack Integration Test</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Slack API Connection</CardTitle>
            <CardDescription>
              This will test if your Slack OAuth tokens are working properly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testSlackConnection}
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Testing...' : 'Test Slack Connection'}
            </Button>
            
            {result && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SlackTest;
