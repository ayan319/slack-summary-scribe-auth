'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Brain, FileText, Upload, Download } from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_summaries: number;
    total_ai_requests: number;
    total_file_uploads: number;
    total_exports: number;
    avg_quality_score: number;
    summaries_trend: number;
    current_plan: string;
    plan_usage: {
      summaries_used: number;
      summaries_limit: number;
      ai_requests_used: number;
      ai_requests_limit: number;
      file_uploads_used: number;
      file_uploads_limit: number;
    };
  };
  daily_data: Array<{
    date: string;
    summaries: number;
    ai_requests: number;
    file_uploads: number;
    exports: number;
    quality_score: number;
  }>;
  ai_models: Record<string, {
    usage_count: number;
    avg_quality: number;
    avg_cost: number;
    avg_processing_time: number;
  }>;
  top_sources: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
  timeframe: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export function AnalyticsCharts({ data, timeframe }: AnalyticsChartsProps) {
  const { overview, daily_data, ai_models, top_sources } = data;

  // Prepare AI models data for charts
  const aiModelsData = Object.entries(ai_models).map(([model, stats]) => ({
    name: model.replace('-', ' ').toUpperCase(),
    usage: stats.usage_count,
    quality: Math.round(stats.avg_quality * 100),
    cost: stats.avg_cost,
    time: stats.avg_processing_time
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeframe === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeframe === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_summaries}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {getTrendIcon(overview.summaries_trend)}
              <span className={getTrendColor(overview.summaries_trend)}>
                {Math.abs(overview.summaries_trend).toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_ai_requests}</div>
            <div className="text-xs text-muted-foreground">
              Avg quality: {(overview.avg_quality_score * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_file_uploads}</div>
            <div className="text-xs text-muted-foreground">
              {overview.plan_usage.file_uploads_used}/{overview.plan_usage.file_uploads_limit} used
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_exports}</div>
            <div className="text-xs text-muted-foreground">
              PDF, Excel, Notion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends Chart */}
      <Card data-testid="analytics-chart">
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>
            Summary generation and AI usage over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value, name) => [value, name === 'summaries' ? 'Summaries' : 'AI Requests']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="summaries"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Summaries"
              />
              <Area
                type="monotone"
                dataKey="ai_requests"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
                name="AI Requests"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Models Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Models Performance</CardTitle>
            <CardDescription>
              Usage and quality comparison across AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={aiModelsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#8884d8" name="Usage Count" />
                <Bar dataKey="quality" fill="#82ca9d" name="Quality %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Content Sources</CardTitle>
            <CardDescription>
              Where your summaries are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={top_sources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {top_sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Score Trend</CardTitle>
          <CardDescription>
            AI summary quality over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={daily_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis 
                domain={[0.5, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                fontSize={12}
              />
              <Tooltip 
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value) => [`${(value as number * 100).toFixed(1)}%`, 'Quality Score']}
              />
              <Line
                type="monotone"
                dataKey="quality_score"
                stroke="#ff7300"
                strokeWidth={2}
                dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>
            Current plan limits and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan</span>
              <Badge variant="outline">{overview.current_plan}</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Summaries</span>
                  <span>{overview.plan_usage.summaries_used}/{overview.plan_usage.summaries_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((overview.plan_usage.summaries_used / overview.plan_usage.summaries_limit) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span>AI Requests</span>
                  <span>{overview.plan_usage.ai_requests_used}/{overview.plan_usage.ai_requests_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((overview.plan_usage.ai_requests_used / overview.plan_usage.ai_requests_limit) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span>File Uploads</span>
                  <span>{overview.plan_usage.file_uploads_used}/{overview.plan_usage.file_uploads_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((overview.plan_usage.file_uploads_used / overview.plan_usage.file_uploads_limit) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
