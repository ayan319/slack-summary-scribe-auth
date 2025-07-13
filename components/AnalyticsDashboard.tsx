'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Upload, 
  Download,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface UsageMetrics {
  uploads: number;
  summaries: number;
  exports: number;
  activeUsers: number;
}

interface DailyActivity {
  date: string;
  uploads: number;
  summaries: number;
  exports: number;
  pageViews: number;
}

interface AnalyticsDashboardProps {
  organizationId?: string;
  isAdmin?: boolean;
}

const AnalyticsDashboard = React.memo(function AnalyticsDashboard({ organizationId, isAdmin = false }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<UsageMetrics>({
    uploads: 0,
    summaries: 0,
    exports: 0,
    activeUsers: 0
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch usage metrics
      const metricsResponse = await fetch(`/api/analytics/metrics${organizationId ? `?organizationId=${organizationId}` : ''}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Fetch daily activity
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const activityResponse = await fetch(`/api/analytics/activity?days=${days}${organizationId ? `&organizationId=${organizationId}` : ''}`);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setDailyActivity(activityData.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateGrowth = (data: DailyActivity[], field: keyof DailyActivity) => {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-7).reduce((sum, item) => sum + (item[field] as number), 0);
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + (item[field] as number), 0);
    
    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
  };

  const pieData = [
    { name: 'Uploads', value: metrics.uploads, color: '#3b82f6' },
    { name: 'Summaries', value: metrics.summaries, color: '#10b981' },
    { name: 'Exports', value: metrics.exports, color: '#8b5cf6' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {organizationId ? 'Organization' : 'Personal'} usage insights and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Uploads
                </p>
                <p className="text-2xl font-bold">{metrics.uploads}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Badge variant={calculateGrowth(dailyActivity, 'uploads') >= 0 ? 'default' : 'destructive'}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {calculateGrowth(dailyActivity, 'uploads')}%
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Summaries Generated
                </p>
                <p className="text-2xl font-bold">{metrics.summaries}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Badge variant={calculateGrowth(dailyActivity, 'summaries') >= 0 ? 'default' : 'destructive'}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {calculateGrowth(dailyActivity, 'summaries')}%
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Exports
                </p>
                <p className="text-2xl font-bold">{metrics.exports}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Badge variant={calculateGrowth(dailyActivity, 'exports') >= 0 ? 'default' : 'destructive'}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {calculateGrowth(dailyActivity, 'exports')}%
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Badge variant="secondary">
                <Activity className="h-3 w-3 mr-1" />
                Last {timeRange}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>
              Daily activity over the last {timeRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value, name) => [value, name]}
                />
                <Area 
                  type="monotone" 
                  dataKey="uploads" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Uploads"
                />
                <Area 
                  type="monotone" 
                  dataKey="summaries" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Summaries"
                />
                <Area 
                  type="monotone" 
                  dataKey="exports" 
                  stackId="1"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.6}
                  name="Exports"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
            <CardDescription>
              Breakdown of platform usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity Breakdown</CardTitle>
          <CardDescription>
            Detailed view of daily platform usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value, name) => [value, name]}
              />
              <Bar dataKey="uploads" fill="#3b82f6" name="Uploads" />
              <Bar dataKey="summaries" fill="#10b981" name="Summaries" />
              <Bar dataKey="exports" fill="#8b5cf6" name="Exports" />
              <Bar dataKey="pageViews" fill="#f59e0b" name="Page Views" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

export default AnalyticsDashboard;
