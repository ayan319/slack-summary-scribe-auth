
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Slack, User, Calendar, Activity } from 'lucide-react';

interface SlackToken {
  id: string;
  team_id: string;
  team_name: string;
  user_id: string;
  scope: string;
  created_at: string;
}

const Dashboard = () => {
  const [slackTokens, setSlackTokens] = useState<SlackToken[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlackTokens();
  }, []);

  const fetchSlackTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('slack_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSlackTokens(data || []);
    } catch (error) {
      console.error('Error fetching Slack tokens:', error);
      toast({
        title: "Error",
        description: "Failed to load Slack connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectSlack = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('slack_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setSlackTokens(prev => prev.filter(token => token.id !== tokenId));
      toast({
        title: "Success",
        description: "Slack workspace disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting Slack:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Slack workspace",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your Slack integrations and view your activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Workspaces</CardTitle>
              <Slack className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{slackTokens.length}</div>
              <p className="text-xs text-muted-foreground">
                Active Slack connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Connected</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {slackTokens.length > 0 
                  ? new Date(slackTokens[0].created_at).toLocaleDateString()
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent integration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Slack Workspaces</CardTitle>
              <CardDescription>
                Manage your Slack workspace connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : slackTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Slack className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Slack workspaces connected</h3>
                  <p className="text-gray-500 mb-4">Connect your first Slack workspace to get started</p>
                  <Button onClick={() => navigate('/')}>
                    Add to Slack
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {slackTokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Slack className="h-8 w-8 text-purple-600" />
                        <div>
                          <h4 className="font-medium">{token.team_name}</h4>
                          <p className="text-sm text-gray-500">Team ID: {token.team_id}</p>
                          <p className="text-xs text-gray-400">
                            Connected: {new Date(token.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/slack-test')}
                        >
                          Test Connection
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => disconnectSlack(token.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your Slack integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate('/slack-test')}
                className="w-full"
                variant="outline"
              >
                Test Slack Connection
              </Button>
              <Button
                onClick={() => navigate('/settings')}
                className="w-full"
                variant="outline"
              >
                Account Settings
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="w-full"
              >
                Add Another Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
