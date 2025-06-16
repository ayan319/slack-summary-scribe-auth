
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { NotionSettings as NotionSettingsType } from '@/types/summary';

interface NotionSettingsProps {
  settings: NotionSettingsType;
  onSettingsChange: (settings: NotionSettingsType) => void;
}

export const NotionSettings: React.FC<NotionSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [databaseId, setDatabaseId] = useState(settings.databaseId || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Redirect to Notion OAuth
      const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/notion/callback')}`;
      window.open(notionAuthUrl, '_blank', 'width=600,height=700');
      
      // In a real implementation, you'd handle the OAuth callback
      setTimeout(() => {
        onSettingsChange({
          ...settings,
          isConnected: true,
          accessToken: 'mock_token'
        });
        toast({
          title: "Connected to Notion",
          description: "Successfully connected your Notion workspace",
        });
        setIsConnecting(false);
      }, 2000);
    } catch (error) {
      console.error('Notion connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Notion. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onSettingsChange({
      isConnected: false,
      accessToken: undefined,
      databaseId: undefined,
      autoSync: false
    });
    setDatabaseId('');
    toast({
      title: "Disconnected from Notion",
      description: "Your Notion integration has been disconnected",
    });
  };

  const handleSaveDatabase = () => {
    if (!databaseId.trim()) {
      toast({
        title: "Database ID Required",
        description: "Please enter a valid Notion database ID",
        variant: "destructive",
      });
      return;
    }

    onSettingsChange({
      ...settings,
      databaseId: databaseId.trim()
    });
    toast({
      title: "Database Updated",
      description: "Notion database ID has been saved",
    });
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      autoSync: enabled
    });
    toast({
      title: enabled ? "Auto-sync Enabled" : "Auto-sync Disabled",
      description: enabled 
        ? "Summaries will automatically sync to Notion" 
        : "Summaries will not automatically sync to Notion",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Notion Settings
          {settings.isConnected && (
            <Badge variant="secondary" className="ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notion Integration Settings</DialogTitle>
          <DialogDescription>
            Configure how your summaries sync with Notion
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {settings.isConnected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Connected to Notion
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Not Connected
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.isConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your Notion workspace is connected and ready to sync summaries.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Disconnect Notion
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Connect your Notion workspace to automatically sync interview summaries.
                  </p>
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isConnecting ? 'Connecting...' : 'Connect to Notion'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Configuration */}
          {settings.isConnected && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Database Configuration</CardTitle>
                <CardDescription>
                  Specify which Notion database to sync summaries to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="databaseId">Database ID</Label>
                  <Input
                    id="databaseId"
                    placeholder="Enter your Notion database ID"
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    You can find the database ID in your Notion database URL
                  </p>
                </div>
                <Button 
                  onClick={handleSaveDatabase}
                  size="sm"
                  disabled={!databaseId.trim()}
                >
                  Save Database ID
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Auto-sync Settings */}
          {settings.isConnected && settings.databaseId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Auto-sync Settings</CardTitle>
                <CardDescription>
                  Configure automatic syncing behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="autoSync">Auto-sync new summaries</Label>
                    <p className="text-sm text-gray-500">
                      Automatically sync new summaries to Notion
                    </p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={settings.autoSync}
                    onCheckedChange={handleAutoSyncToggle}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
