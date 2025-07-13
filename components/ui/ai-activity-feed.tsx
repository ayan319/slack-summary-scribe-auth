'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  FileText, 
  Upload, 
  Download, 
  Slack, 
  Star,
  Clock,
  TrendingUp,
  Zap,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityFeedSkeleton } from './skeleton-loaders';

interface ActivityItem {
  id: string;
  type: 'summary_created' | 'file_uploaded' | 'export_completed' | 'slack_connected' | 'ai_request';
  title: string;
  description: string;
  timestamp: string;
  ai_model?: string | null;
  quality_score?: number | null;
  metadata?: {
    file_size?: number;
    export_format?: string;
    channel_name?: string;
    processing_time?: number;
    cost?: number;
  };
}

interface AIActivityFeedProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onViewAll?: () => void;
}

export function AIActivityFeed({ 
  activities = [], 
  isLoading = false, 
  onRefresh,
  onViewAll 
}: AIActivityFeedProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing activity feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'summary_created':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'file_uploaded':
        return <Upload className="h-5 w-5 text-green-500" />;
      case 'export_completed':
        return <Download className="h-5 w-5 text-purple-500" />;
      case 'slack_connected':
        return <Slack className="h-5 w-5 text-purple-600" />;
      case 'ai_request':
        return <Brain className="h-5 w-5 text-orange-500" />;
      default:
        return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'summary_created':
        return 'border-l-blue-500';
      case 'file_uploaded':
        return 'border-l-green-500';
      case 'export_completed':
        return 'border-l-purple-500';
      case 'slack_connected':
        return 'border-l-purple-600';
      case 'ai_request':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getAIModelBadge = (model: string) => {
    switch (model) {
      case 'deepseek-r1':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">DeepSeek R1</Badge>;
      case 'gpt-4o':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700">GPT-4o</Badge>;
      case 'claude-3-5-sonnet':
        return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Claude 3.5</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{model}</Badge>;
    }
  };

  const getQualityBadge = (score: number) => {
    const percentage = Math.round(score * 100);
    const color = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center space-x-1 text-xs ${color}`}>
        <Star className="h-3 w-3" />
        <span>{percentage}%</span>
      </div>
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>AI Activity Feed</span>
            </CardTitle>
            <CardDescription>
              Recent AI processing and summarization activity
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {onViewAll && (
              <Button variant="outline" size="sm" onClick={onViewAll}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-12 w-12 text-gray-300 mb-4" />
            <h4 className="text-sm font-medium text-gray-700 mb-2">No recent activity</h4>
            <p className="text-xs text-gray-500">
              Start creating summaries to see your AI activity here
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              <AnimatePresence>
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`relative pl-6 pb-4 border-l-2 ${getActivityColor(activity.type)} last:border-l-0 last:pb-0`}
                  >
                    <div className="absolute -left-3 top-0 bg-white border-2 border-gray-200 rounded-full p-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {activity.title}
                        </h4>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {activity.ai_model && getAIModelBadge(activity.ai_model)}
                          {activity.quality_score && getQualityBadge(activity.quality_score)}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {activity.metadata?.processing_time && (
                            <span>{activity.metadata.processing_time.toFixed(1)}s</span>
                          )}
                          {activity.metadata?.file_size && (
                            <span>{formatFileSize(activity.metadata.file_size)}</span>
                          )}
                          {activity.metadata?.export_format && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.export_format.toUpperCase()}
                            </Badge>
                          )}
                          {activity.metadata?.cost && activity.metadata.cost > 0 && (
                            <span className="text-green-600">
                              ${activity.metadata.cost.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
