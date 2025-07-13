import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let userId = null;

    if (sessionError || !session) {
      console.log('No session found, returning demo analytics data for testing');
      // For testing purposes, return demo analytics when no session
      userId = 'demo-user';
    } else {
      userId = session.user.id;
    }
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y

    // Demo mode - return comprehensive mock analytics
    if (userId) {
      const mockAnalytics = generateMockAnalytics(timeframe);
      return NextResponse.json({
        success: true,
        data: mockAnalytics
      });
    }

    // In production, this would fetch real analytics from the database
    const analytics = await fetchUserAnalytics(supabase, userId, timeframe);

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockAnalytics(timeframe: string) {
  const now = new Date();
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  
  // Generate daily data points
  const dailyData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    dailyData.push({
      date: date.toISOString().split('T')[0],
      summaries: Math.floor(Math.random() * 15) + 1,
      ai_requests: Math.floor(Math.random() * 25) + 5,
      file_uploads: Math.floor(Math.random() * 8) + 1,
      exports: Math.floor(Math.random() * 5) + 1,
      quality_score: 0.7 + Math.random() * 0.25,
    });
  }

  // Calculate totals and trends
  const totalSummaries = dailyData.reduce((sum, day) => sum + day.summaries, 0);
  const totalAIRequests = dailyData.reduce((sum, day) => sum + day.ai_requests, 0);
  const totalFileUploads = dailyData.reduce((sum, day) => sum + day.file_uploads, 0);
  const totalExports = dailyData.reduce((sum, day) => sum + day.exports, 0);
  const avgQualityScore = dailyData.reduce((sum, day) => sum + day.quality_score, 0) / dailyData.length;

  // Calculate trends (comparing first half vs second half)
  const midpoint = Math.floor(dailyData.length / 2);
  const firstHalf = dailyData.slice(0, midpoint);
  const secondHalf = dailyData.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.summaries, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.summaries, 0) / secondHalf.length;
  const summariesTrend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  return {
    overview: {
      total_summaries: totalSummaries,
      total_ai_requests: totalAIRequests,
      total_file_uploads: totalFileUploads,
      total_exports: totalExports,
      avg_quality_score: Math.round(avgQualityScore * 100) / 100,
      summaries_trend: Math.round(summariesTrend * 10) / 10,
      current_plan: 'FREE',
      plan_usage: {
        summaries_used: totalSummaries,
        summaries_limit: 50,
        ai_requests_used: totalAIRequests,
        ai_requests_limit: 300,
        file_uploads_used: totalFileUploads,
        file_uploads_limit: 20
      }
    },
    daily_data: dailyData,
    ai_models: {
      'deepseek-r1': {
        usage_count: Math.floor(totalAIRequests * 0.8),
        avg_quality: 0.76,
        avg_cost: 0.0,
        avg_processing_time: 2.3
      },
      'gpt-4o': {
        usage_count: Math.floor(totalAIRequests * 0.15),
        avg_quality: 0.85,
        avg_cost: 0.03,
        avg_processing_time: 4.1
      },
      'claude-3-5-sonnet': {
        usage_count: Math.floor(totalAIRequests * 0.05),
        avg_quality: 0.82,
        avg_cost: 0.03,
        avg_processing_time: 3.8
      }
    },
    top_sources: [
      { name: 'Slack Channels', count: Math.floor(totalSummaries * 0.6), percentage: 60 },
      { name: 'File Uploads', count: Math.floor(totalSummaries * 0.25), percentage: 25 },
      { name: 'Manual Input', count: Math.floor(totalSummaries * 0.15), percentage: 15 }
    ],
    recent_activity: [
      {
        id: '1',
        type: 'summary_created',
        title: 'Team Standup Summary',
        description: 'Generated summary from #general channel',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        ai_model: 'deepseek-r1',
        quality_score: 0.78
      },
      {
        id: '2',
        type: 'file_uploaded',
        title: 'Meeting Notes.pdf',
        description: 'Uploaded and processed PDF document',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        ai_model: 'gpt-4o',
        quality_score: 0.85
      },
      {
        id: '3',
        type: 'export_completed',
        title: 'Weekly Report Export',
        description: 'Exported to PDF and sent via email',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        ai_model: 'claude-3-5-sonnet',
        quality_score: 0.82
      },
      {
        id: '4',
        type: 'slack_connected',
        title: 'Slack Integration',
        description: 'Connected workspace "Acme Corp"',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ai_model: null,
        quality_score: null
      }
    ],
    insights: [
      {
        type: 'trend',
        title: 'Summary Generation Increasing',
        description: `Your summary generation has increased by ${Math.abs(summariesTrend).toFixed(1)}% this ${timeframe}`,
        action: 'Consider upgrading to Pro for unlimited summaries',
        priority: summariesTrend > 20 ? 'high' : 'medium'
      },
      {
        type: 'quality',
        title: 'High Quality Scores',
        description: `Your average quality score is ${(avgQualityScore * 100).toFixed(0)}%`,
        action: 'Try premium AI models for even better results',
        priority: 'low'
      },
      {
        type: 'usage',
        title: 'Approaching Plan Limits',
        description: `You've used ${Math.round((totalSummaries / 50) * 100)}% of your monthly summary quota`,
        action: 'Upgrade to Pro for unlimited summaries',
        priority: totalSummaries > 40 ? 'high' : 'medium'
      }
    ]
  };
}

async function fetchUserAnalytics(supabase: any, userId: string, timeframe: string) {
  // This would implement real analytics fetching from the database
  // For now, return the mock data
  return generateMockAnalytics(timeframe);
}
