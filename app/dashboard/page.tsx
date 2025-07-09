'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth, withAuth } from '@/components/providers/AuthProvider';
import { signOut } from '@/lib/auth';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';
import CreateOrganizationModal, { useCreateOrganizationModal } from '@/components/CreateOrganizationModal';
import {
  Menu,
  MessageSquare,
  Users,
  Slack,
  TrendingUp,
  RefreshCw,
  Settings,
  LogOut,
  Plus,
  AlertCircle,
  FileText,
  Calendar,
  Download,
  Upload,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

interface DashboardStats {
  totalSummaries: number;
  slackIntegrations: number;
  summariesThisMonth: number;
  teamMembers: number;
}

interface SlackIntegration {
  id: string;
  slack_team_name: string;
  connected: boolean;
  created_at: string;
}

interface RecentSummary {
  id: string;
  title: string;
  channel_name: string;
  created_at: string;
  message_count: number;
}

function DashboardPage() {
  const { user, organizations, currentOrganization } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [slackIntegrations, setSlackIntegrations] = useState<SlackIntegration[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<RecentSummary[]>([]);

  const { open: isCreateOrgOpen, openModal: openCreateOrg, closeModal: closeCreateOrg } = useCreateOrganizationModal();

  const fetchDashboardData = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setError('');

      // Mock data for now - replace with actual API calls
      setStats({
        totalSummaries: 42,
        slackIntegrations: 1,
        summariesThisMonth: 12,
        teamMembers: organizations.length > 0 ? 3 : 1,
      });

      setSlackIntegrations([
        {
          id: '1',
          slack_team_name: 'Example Team',
          connected: true,
          created_at: new Date().toISOString(),
        }
      ]);

      setRecentSummaries([
        {
          id: '1',
          title: 'Weekly Standup Summary',
          channel_name: 'general',
          created_at: new Date().toISOString(),
          message_count: 25,
        },
        {
          id: '2',
          title: 'Product Discussion',
          channel_name: 'product',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          message_count: 18,
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentOrganization, organizations.length]);

  useEffect(() => {
    if (currentOrganization) {
      fetchDashboardData();
    }
  }, [currentOrganization, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Slack Summary Scribe</h2>
        <p className="text-sm text-muted-foreground">AI-powered summaries</p>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Organization Switcher */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Organization</label>
          <OrganizationSwitcher />
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <Button variant="default" className="w-full justify-start">
            <MessageSquare className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Summaries
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Slack className="mr-2 h-4 w-4" />
            Integrations
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Team
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Actions</label>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Upload className="mr-2 h-4 w-4" />
            Upload Transcript
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Connect Slack
          </Button>
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold">Dashboard</h1>

        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 border-r min-h-screen">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSummaries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.summariesThisMonth || 0} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slack Integrations</CardTitle>
                <Slack className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.slackIntegrations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.summariesThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.teamMembers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Recent Summaries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Summaries
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Your latest AI-generated summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSummaries.map((summary) => (
                    <div key={summary.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{summary.title}</p>
                        <p className="text-xs text-muted-foreground">
                          #{summary.channel_name} • {summary.message_count} messages
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(summary.created_at).toLocaleDateString()}
                        </p>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {recentSummaries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No summaries yet</p>
                      <p className="text-xs">Upload a transcript to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Slack Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Slack Integrations
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage your Slack workspace connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slackIntegrations.map((integration) => (
                    <div key={integration.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Slack className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{integration.slack_team_name}</p>
                        <div className="flex items-center space-x-2">
                          {integration.connected ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Connected</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600">Disconnected</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {slackIntegrations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Slack className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No integrations yet</p>
                      <p className="text-xs">Connect your first Slack workspace</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal open={isCreateOrgOpen} onOpenChange={closeCreateOrg} />
    </div>
  );
}

// Export the component wrapped with authentication
export default withAuth(DashboardPage, { requireOrganization: true });
