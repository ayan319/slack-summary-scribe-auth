'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Import new components
import { AnalyticsCharts } from '@/components/ui/analytics-charts';
import { PersonalizedGreeting } from '@/components/ui/personalized-greeting';
import { SlackStatus } from '@/components/ui/slack-status';
import { NotificationsDropdown } from '@/components/ui/notifications-dropdown';
import { AIActivityFeed } from '@/components/ui/ai-activity-feed';
import { SmartActionCards, getDefaultActionCards, getInsightCards } from '@/components/ui/smart-action-cards';
import { MobileOptimizedGrid, useGridState } from '@/components/ui/mobile-optimized-grid';
import { 
  DashboardCardSkeleton, 
  ChartSkeleton, 
  GreetingSkeleton,
  ShimmerEffect 
} from '@/components/ui/skeleton-loaders';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    created_at: string;
  };
  analytics: any;
  slackIntegration?: any;
  activities: any[];
  insights: any[];
  onboardingProgress: number;
}

export default function EnhancedDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('30d');

  const { items: gridItems, reorderItems } = useGridState([]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchDashboardData();
    }
  }, [user, userLoading, timeframe]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/analytics?timeframe=${timeframe}`);
      const analyticsData = await analyticsResponse.json();

      // Fetch user profile
      const { data: profile } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Fetch Slack integration
      const { data: slackIntegration } = await (supabase as any)
        .from('slack_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      // Mock data for demo
      const mockData: DashboardData = {
        user: {
          id: user?.id || '',
          name: profile?.name || (user as any)?.user_metadata?.name || 'User',
          email: user?.email || '',
          avatar_url: profile?.avatar_url || (user as any)?.user_metadata?.avatar_url,
          plan: profile?.plan || 'FREE',
          created_at: profile?.created_at || new Date().toISOString()
        },
        analytics: analyticsData.success ? analyticsData.data : null,
        slackIntegration,
        activities: analyticsData.data?.recent_activity || [],
        insights: analyticsData.data?.insights || [],
        onboardingProgress: 75 // Mock progress
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  const handleSlackConnect = () => {
    router.push('/slack/connect');
  };

  const handleSlackReconnect = async () => {
    // Implement reconnect logic
    toast.success('Reconnecting to Slack...');
  };

  const handleSlackDisconnect = async () => {
    // Implement disconnect logic
    toast.success('Slack disconnected');
  };

  if (!user) {
    return <AuthGuard><div>Loading...</div></AuthGuard>;
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GreetingSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <DashboardCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const actionCards = [
    ...getDefaultActionCards(
      dashboardData.user.plan,
      !!dashboardData.slackIntegration,
      dashboardData.onboardingProgress
    ),
    ...getInsightCards(dashboardData.insights)
  ];

  const dashboardGridItems = [
    {
      id: 'analytics',
      component: dashboardData.analytics ? (
        <AnalyticsCharts data={dashboardData.analytics} timeframe={timeframe} />
      ) : (
        <ChartSkeleton />
      ),
      span: { mobile: 1, tablet: 2, desktop: 4 },
      priority: 10
    },
    {
      id: 'slack-status',
      component: (
        <SlackStatus
          integration={dashboardData.slackIntegration}
          onConnect={handleSlackConnect}
          onReconnect={handleSlackReconnect}
          onDisconnect={handleSlackDisconnect}
        />
      ),
      span: { mobile: 1, tablet: 1, desktop: 2 },
      priority: 9
    },
    {
      id: 'activity-feed',
      component: (
        <AIActivityFeed
          activities={dashboardData.activities}
          onRefresh={fetchDashboardData}
          onViewAll={() => router.push('/dashboard/activity')}
        />
      ),
      span: { mobile: 1, tablet: 1, desktop: 2 },
      priority: 8
    },
    {
      id: 'action-cards',
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recommended Actions</h3>
          <SmartActionCards
            cards={actionCards}
            onCardAction={(cardId, action) => {
              console.log('Card action:', cardId, action);
            }}
            onDismiss={(cardId) => {
              console.log('Dismissed card:', cardId);
            }}
          />
        </div>
      ),
      span: { mobile: 1, tablet: 2, desktop: 2 },
      priority: 7
    }
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header with notifications */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <div data-testid="notifications-dropdown">
                  <NotificationsDropdown />
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings')}
                  data-testid="settings-button"
                >
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Personalized Greeting */}
          <PersonalizedGreeting
            data={{
              user: dashboardData.user,
              stats: {
                total_summaries: dashboardData.analytics?.overview?.total_summaries || 0,
                summaries_today: 3, // Mock data
                streak_days: 5, // Mock data
                quality_score: dashboardData.analytics?.overview?.avg_quality_score || 0.75
              },
              achievements: [] // Mock achievements
            }}
            onUpgradeClick={handleUpgradeClick}
          />

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <MobileOptimizedGrid
                items={dashboardGridItems}
                enableSwipe={true}
                enableReorder={false}
                onReorder={reorderItems}
                className="space-y-6"
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              {dashboardData.analytics ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
                    <div className="flex items-center space-x-2">
                      {['7d', '30d', '90d', '1y'].map((period) => (
                        <Button
                          key={period}
                          variant={timeframe === period ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTimeframe(period)}
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <AnalyticsCharts data={dashboardData.analytics} timeframe={timeframe} />
                </motion.div>
              ) : (
                <ChartSkeleton />
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AIActivityFeed
                  activities={dashboardData.activities}
                  onRefresh={fetchDashboardData}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}
