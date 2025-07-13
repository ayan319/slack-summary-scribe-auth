'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Slack,
  Users,
  MessageSquare,
  Clock,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SlackIntegration {
  id: string;
  team_id: string;
  team_name: string;
  is_active: boolean;
  last_sync: string;
  channels_count: number;
  messages_processed: number;
  created_at: string;
  scope: string;
}

interface SlackStatusProps {
  integration?: SlackIntegration;
  isLoading?: boolean;
  onConnect?: () => void;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}

export function SlackStatus({ 
  integration, 
  isLoading = false, 
  onConnect, 
  onReconnect, 
  onDisconnect 
}: SlackStatusProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      if (onReconnect) {
        await onReconnect();
        toast.success('Slack workspace reconnected successfully!');
      }
    } catch (error) {
      toast.error('Failed to reconnect Slack workspace');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      if (onDisconnect) {
        await onDisconnect();
        toast.success('Slack workspace disconnected');
      }
    } catch (error) {
      toast.error('Failed to disconnect Slack workspace');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getLastSyncText = () => {
    if (!integration?.last_sync) return 'Never';
    
    const lastSync = new Date(integration.last_sync);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getStatusColor = () => {
    if (!integration) return 'text-gray-500 dark:text-gray-400';
    if (!integration.is_active) return 'text-red-500 dark:text-red-400';

    const lastSync = new Date(integration.last_sync);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'text-green-500 dark:text-green-400';
    if (diffHours < 24) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getStatusIcon = () => {
    if (!integration) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    if (!integration.is_active) return <AlertCircle className="h-5 w-5 text-red-500" />;
    
    const lastSync = new Date(integration.last_sync);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!integration) return 'Not Connected';
    if (!integration.is_active) return 'Disconnected';
    
    const lastSync = new Date(integration.last_sync);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Active';
    if (diffHours < 24) return 'Connected';
    return 'Needs Attention';
  };

  if (isLoading) {
    return <SlackStatusSkeleton />;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Slack className="h-5 w-5 text-purple-600" />
          <span>Slack Integration</span>
        </CardTitle>
        <CardDescription>
          {integration 
            ? `Connected to ${integration.team_name}` 
            : 'Connect your Slack workspace to start generating summaries'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!integration ? (
          // Not connected state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <Slack className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Connect Your Slack Workspace</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start generating AI-powered summaries from your Slack conversations
              </p>
              <Button 
                onClick={onConnect}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Slack
              </Button>
            </div>
          </motion.div>
        ) : (
          // Connected state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status Overview */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div>
                  <div className="font-medium text-gray-900">{integration.team_name}</div>
                  <div className={`text-sm ${getStatusColor()}`}>
                    {getStatusText()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={integration.is_active ? "default" : "destructive"}>
                  {integration.is_active ? 'Active' : 'Inactive'}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                >
                  {isReconnecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Channels</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {integration.channels_count || 0}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Messages</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {integration.messages_processed || 0}
                </div>
              </div>
            </div>

            {/* Last Sync Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Last Sync</span>
                </div>
                <span className="text-sm text-gray-600">{getLastSyncText()}</span>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Permissions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {integration.scope?.split(',').map((scope, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {scope.trim()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Warning for inactive integration */}
            {!integration.is_active && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Your Slack integration is inactive. Click reconnect to restore functionality.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="flex-1"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </>
                )}
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                size="sm"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function SlackStatusSkeleton() {
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
