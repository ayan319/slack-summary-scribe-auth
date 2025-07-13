'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ExternalLink, Settings, CheckCircle, AlertCircle, 
  Calendar, FileText, Users, Building, 
  Slack, Video, Database, Zap 
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  connected: boolean;
  status: 'active' | 'error' | 'disconnected';
  lastSync?: Date;
  features: string[];
  category: 'communication' | 'productivity' | 'crm' | 'storage';
}

export default function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect your Slack workspace for AI-powered conversation summaries',
      icon: Slack,
      connected: true,
      status: 'active',
      lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      features: ['Message Summarization', 'Channel Analysis', 'Auto-posting'],
      category: 'communication'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Export summaries directly to your Notion workspace',
      icon: FileText,
      connected: false,
      status: 'disconnected',
      features: ['Page Export', 'Database Integration', 'Template Support'],
      category: 'productivity'
    },
    {
      id: 'google-meet',
      name: 'Google Meet',
      description: 'Summarize your Google Meet recordings and transcripts',
      icon: Video,
      connected: false,
      status: 'disconnected',
      features: ['Meeting Summaries', 'Action Items', 'Recording Analysis'],
      category: 'communication'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync summaries with your HubSpot CRM contacts and deals',
      icon: Building,
      connected: false,
      status: 'disconnected',
      features: ['Contact Notes', 'Deal Updates', 'Activity Tracking'],
      category: 'crm'
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Save and organize summaries in your Google Drive',
      icon: Database,
      connected: false,
      status: 'disconnected',
      features: ['File Export', 'Folder Organization', 'Sharing'],
      category: 'storage'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 5000+ apps through Zapier automation',
      icon: Zap,
      connected: false,
      status: 'disconnected',
      features: ['Webhook Triggers', 'Custom Workflows', 'Multi-app Integration'],
      category: 'productivity'
    }
  ]);

  const [loading, setLoading] = useState<string | null>(null);

  const categories = {
    communication: { name: 'Communication', icon: Slack },
    productivity: { name: 'Productivity', icon: FileText },
    crm: { name: 'CRM', icon: Building },
    storage: { name: 'Storage', icon: Database }
  };

  const handleConnect = async (integrationId: string) => {
    setLoading(integrationId);
    
    try {
      switch (integrationId) {
        case 'notion':
          await connectNotion();
          break;
        case 'google-meet':
          await connectGoogleMeet();
          break;
        case 'hubspot':
          await connectHubSpot();
          break;
        case 'google-drive':
          await connectGoogleDrive();
          break;
        case 'zapier':
          await connectZapier();
          break;
        default:
          throw new Error('Integration not implemented');
      }
      
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connected: true, status: 'active' as const, lastSync: new Date() }
          : integration
      ));
      
      toast.success(`${integrations.find(i => i.id === integrationId)?.name} connected successfully!`);
    } catch (error) {
      console.error(`Error connecting ${integrationId}:`, error);
      toast.error(`Failed to connect ${integrations.find(i => i.id === integrationId)?.name}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setLoading(integrationId);
    
    try {
      // Implement disconnect logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connected: false, status: 'disconnected' as const, lastSync: undefined }
          : integration
      ));
      
      toast.success(`${integrations.find(i => i.id === integrationId)?.name} disconnected`);
    } catch (error) {
      console.error(`Error disconnecting ${integrationId}:`, error);
      toast.error(`Failed to disconnect ${integrations.find(i => i.id === integrationId)?.name}`);
    } finally {
      setLoading(null);
    }
  };

  const connectNotion = async () => {
    // Check if Notion is configured
    const response = await fetch('/api/integrations/notion?action=status');
    const data = await response.json();
    
    if (!data.connected) {
      toast.error('Notion integration not configured. Please add NOTION_TOKEN to environment variables.');
      throw new Error('Notion not configured');
    }
  };

  const connectGoogleMeet = async () => {
    // Get Google Meet auth URL
    const response = await fetch('/api/integrations/google-meet?action=auth_url');
    const data = await response.json();
    
    if (data.success) {
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } else {
      throw new Error('Failed to get auth URL');
    }
  };

  const connectHubSpot = async () => {
    // Similar to Google Meet - would redirect to HubSpot OAuth
    toast.info('HubSpot integration coming soon!');
    throw new Error('Not implemented yet');
  };

  const connectGoogleDrive = async () => {
    toast.info('Google Drive integration coming soon!');
    throw new Error('Not implemented yet');
  };

  const connectZapier = async () => {
    toast.info('Zapier integration coming soon!');
    throw new Error('Not implemented yet');
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Integrations</h2>
        <p className="text-gray-600">Connect your favorite tools to supercharge your workflow</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Connected</p>
                <p className="text-2xl font-bold">{integrations.filter(i => i.connected).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Available</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-sm font-medium">
                  {formatLastSync(integrations.find(i => i.connected)?.lastSync)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(categories).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      {Object.entries(categories).map(([categoryKey, category]) => {
        const categoryIntegrations = integrations.filter(i => i.category === categoryKey);
        
        if (categoryIntegrations.length === 0) return null;
        
        return (
          <div key={categoryKey} className="space-y-4">
            <div className="flex items-center space-x-2">
              <category.icon className="h-5 w-5" />
              <h3 className="text-xl font-semibold">{category.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map((integration) => {
                const Icon = integration.icon;
                
                return (
                  <Card key={integration.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusIcon(integration.status)}
                              {getStatusBadge(integration.status)}
                            </div>
                          </div>
                        </div>
                        
                        <Switch
                          checked={integration.connected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleConnect(integration.id);
                            } else {
                              handleDisconnect(integration.id);
                            }
                          }}
                          disabled={loading === integration.id}
                        />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <CardDescription>{integration.description}</CardDescription>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {integration.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {integration.connected && (
                        <div className="text-xs text-gray-500">
                          Last sync: {formatLastSync(integration.lastSync)}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                          disabled={loading === integration.id}
                          className="flex-1"
                        >
                          {loading === integration.id ? (
                            'Connecting...'
                          ) : integration.connected ? (
                            'Reconnect'
                          ) : (
                            'Connect'
                          )}
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
