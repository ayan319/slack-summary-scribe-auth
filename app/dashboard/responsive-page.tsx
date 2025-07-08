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
import InviteTeamModal from '@/components/InviteTeamModal';
import EmailForm from '@/components/EmailForm';
import { DashboardSkeleton, StatsSkeleton, SlackIntegrationSkeleton, SummariesSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { 
  Activity, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Slack,
  RefreshCw,
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
  Mail,
  Building2,
  UserPlus,
  Bot,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { DashboardStats, SlackIntegration, RecentSummary } from './constants';

function DashboardPage() {
  const { user, currentOrganization, organizations } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [slackIntegrations, setSlackIntegrations] = useState<SlackIntegration[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<RecentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to onboarding if no organizations
  useEffect(() => {
    if (user && organizations.length === 0 && !loading) {
      console.log('No organizations found, redirecting to onboarding');
      router.push('/onboarding');
    }
  }, [user, organizations, loading, router]);
  
  const { openModal: openCreateOrgModal, CreateOrganizationModal } = useCreateOrganizationModal();

  // Handle Slack OAuth success/error messages
  useEffect(() => {
    const slackSuccess = searchParams?.get('slack_success');
    const slackError = searchParams?.get('slack_error');
    const teamName = searchParams?.get('team_name');

    if (slackSuccess && teamName) {
      // Show success message
      setError('');
      // You could show a toast here
    } else if (slackError) {
      setError(`Slack connection failed: ${slackError}`);
    }
  }, [searchParams]);

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

  const handleConnectSlack = async () => {
    if (!currentOrganization) return;

    try {
      const response = await fetch(`/api/slack/auth?organization_id=${currentOrganization.id}`);
      const data = await response.json();

      if (data.success && data.oauth_url) {
        window.location.href = data.oauth_url;
      } else {
        setError(data.error || 'Failed to initiate Slack connection');
      }
    } catch (error) {
      console.error('Slack connection error:', error);
      setError('Failed to connect to Slack');
    }
  };

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Slack Summary Scribe</h2>
        <p className="text-sm text-muted-foreground">AI-powered team insights</p>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Organization Switcher */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Organization</label>
          <OrganizationSwitcher
            onCreateOrganization={openCreateOrgModal}
            onManageOrganization={() => {/* TODO: Implement */}}
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setSidebarOpen(false)}>
            <Activity className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => {
            setShowEmailForm(true);
            setSidebarOpen(false);
          }}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => {
            setShowInviteModal(true);
            setSidebarOpen(false);
          }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Team
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Quick Actions</h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleConnectSlack}
          >
            <Slack className="mr-2 h-4 w-4" />
            Connect Slack
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => setShowInviteModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-t">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
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

  if (loading) {
    return <DashboardSkeleton />;
  }

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

      <div className="lg:flex">
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
                  Connected workspaces
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
                  In {currentOrganization?.name}
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
                  +20% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slack Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Slack className="h-5 w-5" />
                  Slack Workspaces
                </CardTitle>
                <CardDescription>
                  Connected Slack workspaces for AI summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slackIntegrations.length > 0 ? (
                  <div className="space-y-3">
                    {slackIntegrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <Slack className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium">{integration.slack_team_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Connected {new Date(integration.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={integration.connected ? 'default' : 'secondary'}>
                          {integration.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Slack className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Slack workspaces connected</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your Slack workspace to start generating AI summaries
                    </p>
                    <Button onClick={handleConnectSlack}>
                      <Slack className="mr-2 h-4 w-4" />
                      Connect Slack
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Summaries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Recent Summaries
                </CardTitle>
                <CardDescription>
                  Latest AI-generated conversation summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSummaries.length > 0 ? (
                  <div className="space-y-3">
                    {recentSummaries.map((summary) => (
                      <div key={summary.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{summary.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              #{summary.channel_name} • {summary.message_count} messages
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(summary.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No summaries yet</h3>
                    <p className="text-muted-foreground">
                      Connect Slack and generate your first AI summary
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateOrganizationModal />
      
      <InviteTeamModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={() => {
          setShowInviteModal(false);
          handleRefresh();
        }}
      />

      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Send Email</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEmailForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <EmailForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the wrapped component
const WrappedDashboardPage = withAuth(DashboardPage, { requireOrganization: true });
export default WrappedDashboardPage;
