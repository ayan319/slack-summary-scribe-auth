'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  Zap,
  Building2,
  Users,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CRMConnection {
  crm_type: 'hubspot' | 'salesforce' | 'pipedrive';
  is_active: boolean;
  created_at: string;
  token_expires_at?: string;
  status: 'connected' | 'disconnected' | 'expired';
}

interface CRMConnectionsProps {
  userId?: string;
  organizationId?: string;
  onConnectionChange?: (crmType: string, status: string) => void;
  className?: string;
}

const CRM_INFO = {
  hubspot: {
    name: 'HubSpot',
    icon: '🧡',
    color: 'orange',
    description: 'Connect to sync contacts, deals, and notes',
    features: ['Contact Management', 'Deal Tracking', 'Email Integration', 'Analytics']
  },
  salesforce: {
    name: 'Salesforce',
    icon: '☁️',
    color: 'blue',
    description: 'Integrate with the world\'s #1 CRM platform',
    features: ['Lead Management', 'Opportunity Tracking', 'Custom Objects', 'Workflows']
  },
  pipedrive: {
    name: 'Pipedrive',
    icon: '🔧',
    color: 'green',
    description: 'Simple and effective sales pipeline management',
    features: ['Pipeline Management', 'Activity Tracking', 'Deal Insights', 'Mobile App']
  }
};

export function CRMConnections({ 
  userId = 'demo-user-123',
  organizationId = 'demo-org-123',
  onConnectionChange,
  className = ''
}: CRMConnectionsProps) {
  const [connections, setConnections] = useState<CRMConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConnections();
    
    // Check for OAuth callback messages in URL
    const urlParams = new URLSearchParams(window.location.search);
    const crmSuccess = urlParams.get('crm_success');
    const crmError = urlParams.get('crm_error');
    
    if (crmSuccess) {
      setMessage({ type: 'success', text: `Successfully connected to ${crmSuccess.replace('_connected', '')}!` });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (crmError) {
      setMessage({ type: 'error', text: `Connection failed: ${crmError.replace('_', ' ')}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [userId, organizationId]);

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/crm/export?userId=${userId}&organizationId=${organizationId}`);
      const data = await response.json();

      if (data.success) {
        setConnections(data.data.connections);
      }
    } catch (error) {
      console.error('Failed to fetch CRM connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectCRM = async (crmType: string) => {
    setConnecting(crmType);
    
    try {
      // Generate OAuth state with user info
      const state = btoa(JSON.stringify({ userId, organizationId }));
      
      // Redirect to OAuth URL
      let oauthUrl = '';
      switch (crmType) {
        case 'hubspot':
          oauthUrl = `/api/crm/hubspot/oauth?state=${state}`;
          break;
        case 'salesforce':
          oauthUrl = `/api/crm/salesforce/oauth?state=${state}`;
          break;
        case 'pipedrive':
          oauthUrl = `/api/crm/pipedrive/oauth?state=${state}`;
          break;
        default:
          throw new Error('Unsupported CRM type');
      }
      
      // For demo mode, simulate connection
      if (userId === 'demo-user-123') {
        setTimeout(() => {
          setMessage({ type: 'success', text: `Demo: ${CRM_INFO[crmType as keyof typeof CRM_INFO].name} connected successfully!` });
          setConnecting(null);
          
          // Update connection status
          setConnections(prev => prev.map(conn => 
            conn.crm_type === crmType 
              ? { ...conn, is_active: true, status: 'connected' as const }
              : conn
          ));
          
          onConnectionChange?.(crmType, 'connected');
        }, 2000);
        return;
      }
      
      // Redirect to actual OAuth flow
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to connect CRM:', error);
      setMessage({ type: 'error', text: 'Failed to initiate connection' });
      setConnecting(null);
    }
  };

  const disconnectCRM = async (crmType: string) => {
    try {
      // For demo mode, simulate disconnection
      if (userId === 'demo-user-123') {
        setConnections(prev => prev.map(conn => 
          conn.crm_type === crmType 
            ? { ...conn, is_active: false, status: 'disconnected' as const }
            : conn
        ));
        setMessage({ type: 'success', text: `Demo: ${CRM_INFO[crmType as keyof typeof CRM_INFO].name} disconnected` });
        onConnectionChange?.(crmType, 'disconnected');
        return;
      }

      // Actual disconnection logic would go here
      const response = await fetch('/api/crm/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, organizationId, crmType })
      });

      if (response.ok) {
        await fetchConnections();
        setMessage({ type: 'success', text: `${CRM_INFO[crmType as keyof typeof CRM_INFO].name} disconnected` });
        onConnectionChange?.(crmType, 'disconnected');
      }
    } catch (error) {
      console.error('Failed to disconnect CRM:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>CRM Integrations</span>
        </CardTitle>
        <CardDescription>
          Connect your CRM to automatically export summaries and sync data
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {Object.entries(CRM_INFO).map(([crmType, info]) => {
            const connection = connections.find(c => c.crm_type === crmType);
            const isConnecting = connecting === crmType;
            
            return (
              <motion.div
                key={crmType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{info.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{info.name}</h3>
                        {getStatusIcon(connection?.status || 'disconnected')}
                        {getStatusBadge(connection?.status || 'disconnected')}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {info.features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {connection?.status === 'connected' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectCRM(crmType)}
                        >
                          Disconnect
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => connectCRM(crmType)}
                        disabled={isConnecting}
                        className="min-w-[100px]"
                      >
                        {isConnecting ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {connection?.status === 'connected' && connection.created_at && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    Connected on {new Date(connection.created_at).toLocaleDateString()}
                    {connection.token_expires_at && (
                      <span className="ml-2">
                        • Expires {new Date(connection.token_expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Pro Tip</h4>
              <p className="text-sm text-blue-700 mt-1">
                Connect multiple CRMs to automatically sync your summaries across all your sales tools. 
                Each summary can be exported to contacts, deals, or notes based on your workflow.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
