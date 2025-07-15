'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  Hash,
  User,
  Crown,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlackAutoPostSettingsProps {
  userId?: string;
  organizationId?: string;
  isPremium?: boolean;
  onSettingsChange?: (settings: any) => void;
  className?: string;
}

interface AutoPostSettings {
  auto_post_enabled: boolean;
  channel_preference: 'same_channel' | 'dm_user';
}

interface PostHistory {
  id: string;
  summary_id: string;
  slack_channel_id: string;
  status: 'posted' | 'failed' | 'pending';
  error_log?: string;
  posted_at?: string;
  created_at: string;
  summaries: {
    title: string;
    created_at: string;
  };
}

interface Statistics {
  total_posts: number;
  successful_posts: number;
  failed_posts: number;
  pending_posts: number;
}

export function SlackAutoPostSettings({ 
  userId, 
  organizationId, 
  isPremium = false,
  onSettingsChange,
  className = '' 
}: SlackAutoPostSettingsProps) {
  const [settings, setSettings] = useState<AutoPostSettings>({
    auto_post_enabled: false,
    channel_preference: 'same_channel'
  });
  const [statistics, setStatistics] = useState<Statistics>({
    total_posts: 0,
    successful_posts: 0,
    failed_posts: 0,
    pending_posts: 0
  });
  const [recentPosts, setRecentPosts] = useState<PostHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPremium && userId) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [userId, organizationId, isPremium]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/slack/auto-post?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data.settings);
        setStatistics(data.data.statistics);
        setRecentPosts(data.data.recent_posts || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AutoPostSettings>) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/slack/auto-post', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSettings,
          organization_id: organizationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        if (onSettingsChange) {
          onSettingsChange({ ...settings, ...newSettings });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const retryFailedPosts = async () => {
    try {
      const response = await fetch('/api/slack/auto-post', {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh data after retry
        fetchSettings();
      }
    } catch (err) {
      console.error('Failed to retry posts:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isPremium) {
    return (
      <Card className={`border-dashed border-2 border-gray-200 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center space-x-2 mb-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <MessageSquare className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Slack Auto-Post Available</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-sm">
            Upgrade to Pro to automatically post your summaries back to Slack channels or DMs.
          </p>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Slack Auto-Post</span>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Slack Auto-Post</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Send className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </CardTitle>
        <CardDescription>
          Automatically post summaries back to Slack channels or DMs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Enable Auto-Post</label>
              <p className="text-xs text-gray-600">
                Automatically post summaries to Slack after generation
              </p>
            </div>
            <Switch
              checked={settings.auto_post_enabled}
              onCheckedChange={(checked) => updateSettings({ auto_post_enabled: checked })}
              disabled={saving}
            />
          </div>

          <AnimatePresence>
            {settings.auto_post_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-4 border-l-2 border-blue-200"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Post Destination</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="channel_preference"
                        value="same_channel"
                        checked={settings.channel_preference === 'same_channel'}
                        onChange={(e) => updateSettings({ channel_preference: e.target.value as any })}
                        disabled={saving}
                        className="text-blue-600"
                      />
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Same channel as source</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="channel_preference"
                        value="dm_user"
                        checked={settings.channel_preference === 'dm_user'}
                        onChange={(e) => updateSettings({ channel_preference: e.target.value as any })}
                        disabled={saving}
                        className="text-blue-600"
                      />
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Direct message to me</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-900">{statistics.total_posts}</div>
            <div className="text-xs text-blue-700">Total Posts</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-900">{statistics.successful_posts}</div>
            <div className="text-xs text-green-700">Successful</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-900">{statistics.failed_posts}</div>
            <div className="text-xs text-red-700">Failed</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-900">{statistics.pending_posts}</div>
            <div className="text-xs text-yellow-700">Pending</div>
          </div>
        </div>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Posts</h4>
              {statistics.failed_posts > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryFailedPosts}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Failed
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentPosts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(post.status)}
                    <div>
                      <div className="text-sm font-medium">{post.summaries.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(post.status)}>
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
