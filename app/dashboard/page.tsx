'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user-context';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  FileText, 
  Users, 
  TrendingUp, 
  Plus,
  Calendar,
  MessageSquare,
  Download,
  Settings,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  LogOut,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import NotificationCenter from '@/components/NotificationCenter';
import type { Summary } from '@/types/api';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  subscription: {
    plan: string;
    status: string;
  };
  stats: {
    totalSummaries: number;
    workspacesConnected: number;
    summariesThisMonth: number;
  };
  slackWorkspaces: Array<{
    id: string;
    name: string;
    connected: boolean;
    team_id?: string;
  }>;
  recentSummaries: Array<{
    id: string;
    title: string;
    channelName: string;
    createdAt: string;
    messageCount: number;
  }>;
  notifications?: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
  }>;
}

function DashboardContent() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transcript input state
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch dashboard data`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please refresh the page.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    // Add timeout to prevent infinite loading states
    const loadingTimeout = setTimeout(() => {
      if (loading && !error) {
        setError('Loading timed out. Please refresh the page.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout for overall loading

    // Handle user loading state changes
    if (!userLoading) {
      if (user) {
        // User is authenticated, fetch dashboard data
        fetchDashboardData();
      } else {
        // No user, redirect to login
        setLoading(false);
        router.replace('/login');
      }
    } else {
      // Still loading user, but set a maximum wait time
      const userLoadingTimeout = setTimeout(() => {
        if (userLoading) {
          // Force stop loading if user context is stuck
          setLoading(false);
          setError('Authentication check timed out. Please try logging in again.');
        }
      }, 8000); // 8 second timeout for user loading

      return () => {
        clearTimeout(loadingTimeout);
        clearTimeout(userLoadingTimeout);
      };
    }

    return () => clearTimeout(loadingTimeout);
  }, [userLoading, user, fetchDashboardData, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleSummarize = async () => {
    if (!transcriptText.trim()) {
      setSummaryError('Transcript cannot be empty');
      return;
    }

    setIsProcessing(true);
    setSummaryError(null);
    setSummaryResult(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptText: transcriptText.trim(),
          userId: user?.id,
          context: {
            source: 'manual'
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate summary');
      }

      setSummaryResult(result);
      // Refresh dashboard data to show new summary
      fetchDashboardData();
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Summarization error:', error);
      }
      setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">SummaryAI</h1>
              <Badge variant="secondary" aria-label={`Current plan: ${data.subscription.plan}`}>{data.subscription.plan}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={data.user.avatar_url} />
                  <AvatarFallback>
                    {data.user.name?.charAt(0) || data.user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{data.user.name}</p>
                  <p className="text-xs text-gray-500">{data.user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {/* Welcome Section */}
        <section className="mb-8" aria-labelledby="welcome-heading">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 id="welcome-heading" className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {data.user.name || 'there'}!
              </h2>
              <p className="text-gray-600">
                Here's what's happening with your summaries today.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/upload">
                <Button className="flex items-center space-x-2" aria-label="Upload a new document for AI summarization">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Upload Document</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Transcript Input Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Create Summary from Transcript</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  data-testid="transcript-input"
                  placeholder="Paste your meeting transcript, conversation, or any text you'd like to summarize..."
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  className="min-h-[120px] resize-y"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {transcriptText.length} characters
                </div>
                <Button
                  data-testid="summarize-button"
                  onClick={handleSummarize}
                  disabled={!transcriptText.trim() || isProcessing}
                  className="flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div data-testid="loading-spinner" className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Generate Summary</span>
                    </>
                  )}
                </Button>
              </div>

              {summaryError && (
                <Alert variant="destructive">
                  <AlertDescription data-testid="error-message">
                    {summaryError}
                  </AlertDescription>
                </Alert>
              )}

              {summaryResult && (
                <div data-testid="summary-result" className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Summary Generated Successfully!</h4>
                  <p className="text-green-700 mb-3">{summaryResult.content}</p>
                  {summaryResult.skills_detected && summaryResult.skills_detected.length > 0 && (
                    <div data-testid="skills-detected" className="mt-2">
                      <span className="text-sm font-medium text-green-800">Skills detected: </span>
                      <span className="text-sm text-green-700">{summaryResult.skills_detected.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalSummaries}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.summariesThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card data-testid="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Workspaces</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.workspacesConnected}</div>
              <p className="text-xs text-muted-foreground">
                Slack integrations active
              </p>
            </CardContent>
          </Card>

          <Card data-testid="analytics-chart">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.summariesThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                New summaries created
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Summaries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Summaries</CardTitle>
              <CardDescription>Your latest AI-generated summaries</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No summaries yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/slack/connect">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Summary
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentSummaries.map((summary) => (
                    <div key={summary.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{summary.title}</h4>
                        <p className="text-sm text-gray-500">
                          {summary.channelName} • {summary.messageCount} messages
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slack Workspaces */}
          <Card>
            <CardHeader>
              <CardTitle>Slack Workspaces</CardTitle>
              <CardDescription>Manage your connected Slack teams</CardDescription>
            </CardHeader>
            <CardContent>
              {data.slackWorkspaces.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No workspaces connected</p>
                  <Button className="mt-4" asChild>
                    <Link href="/slack/connect">
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Slack Workspace
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.slackWorkspaces.map((workspace) => (
                    <div key={workspace.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${workspace.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{workspace.name}</h4>
                          <p className="text-sm text-gray-500">
                            {workspace.connected ? 'Connected' : 'Disconnected'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <DashboardContent />
      </AuthGuard>
    </ErrorBoundary>
  );
}
