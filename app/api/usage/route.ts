import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let userId = null;
    
    if (sessionError || !session) {
      console.log('No session found, returning demo usage data for testing');
      // For testing purposes, return demo usage when no session
      userId = 'demo-user';
    } else {
      userId = session.user.id;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current'; // current, previous, all

    // Demo mode - return mock usage data
    if (userId) {
      const mockUsage = generateMockUsage(period);
      return NextResponse.json({
        success: true,
        data: mockUsage
      });
    }

    // In production, this would fetch real usage from the database
    const usage = await fetchUserUsage(supabase, userId, period);

    return NextResponse.json({
      success: true,
      data: usage
    });

  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockUsage(period: string) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Base usage for current period
  const baseUsage = {
    summaries: Math.floor(Math.random() * 45) + 5, // 5-50
    ai_requests: Math.floor(Math.random() * 280) + 20, // 20-300
    file_uploads: Math.floor(Math.random() * 18) + 2, // 2-20
    exports: Math.floor(Math.random() * 12) + 1, // 1-13
    slack_connections: Math.floor(Math.random() * 3) + 1, // 1-4
    api_calls: Math.floor(Math.random() * 150) + 10, // 10-160
  };

  // Plan limits
  const planLimits = {
    free: {
      summaries: 50,
      ai_requests: 300,
      file_uploads: 20,
      exports: 15,
      slack_connections: 1,
      api_calls: 200,
    },
    pro: {
      summaries: 500,
      ai_requests: 3000,
      file_uploads: 200,
      exports: 150,
      slack_connections: 10,
      api_calls: 2000,
    },
    enterprise: {
      summaries: -1, // unlimited
      ai_requests: -1,
      file_uploads: -1,
      exports: -1,
      slack_connections: -1,
      api_calls: -1,
    }
  };

  const currentPlan = 'free'; // Default to free plan
  const limits = planLimits[currentPlan];

  // Calculate usage percentages
  const usagePercentages = {
    summaries: limits.summaries > 0 ? (baseUsage.summaries / limits.summaries) * 100 : 0,
    ai_requests: limits.ai_requests > 0 ? (baseUsage.ai_requests / limits.ai_requests) * 100 : 0,
    file_uploads: limits.file_uploads > 0 ? (baseUsage.file_uploads / limits.file_uploads) * 100 : 0,
    exports: limits.exports > 0 ? (baseUsage.exports / limits.exports) * 100 : 0,
    slack_connections: limits.slack_connections > 0 ? (baseUsage.slack_connections / limits.slack_connections) * 100 : 0,
    api_calls: limits.api_calls > 0 ? (baseUsage.api_calls / limits.api_calls) * 100 : 0,
  };

  // Generate historical data for trends
  const historicalData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthUsage = {
      period: date.toISOString().substring(0, 7), // YYYY-MM format
      summaries: Math.floor(Math.random() * 40) + 5,
      ai_requests: Math.floor(Math.random() * 250) + 20,
      file_uploads: Math.floor(Math.random() * 15) + 2,
      exports: Math.floor(Math.random() * 10) + 1,
      slack_connections: Math.floor(Math.random() * 2) + 1,
      api_calls: Math.floor(Math.random() * 120) + 10,
    };
    historicalData.push(monthUsage);
  }

  // Calculate trends
  const currentMonthData = historicalData[historicalData.length - 1];
  const previousMonthData = historicalData[historicalData.length - 2];
  
  const trends = {
    summaries: previousMonthData ? ((currentMonthData.summaries - previousMonthData.summaries) / previousMonthData.summaries) * 100 : 0,
    ai_requests: previousMonthData ? ((currentMonthData.ai_requests - previousMonthData.ai_requests) / previousMonthData.ai_requests) * 100 : 0,
    file_uploads: previousMonthData ? ((currentMonthData.file_uploads - previousMonthData.file_uploads) / previousMonthData.file_uploads) * 100 : 0,
    exports: previousMonthData ? ((currentMonthData.exports - previousMonthData.exports) / previousMonthData.exports) * 100 : 0,
  };

  // Determine warnings and recommendations
  const warnings = [];
  const recommendations = [];

  if (usagePercentages.summaries > 80) {
    warnings.push({
      type: 'approaching_limit',
      resource: 'summaries',
      message: `You've used ${Math.round(usagePercentages.summaries)}% of your monthly summary quota`,
      severity: usagePercentages.summaries > 95 ? 'high' : 'medium'
    });
    recommendations.push({
      type: 'upgrade',
      message: 'Consider upgrading to Pro for 10x more summaries',
      action: 'upgrade_plan'
    });
  }

  if (usagePercentages.ai_requests > 80) {
    warnings.push({
      type: 'approaching_limit',
      resource: 'ai_requests',
      message: `You've used ${Math.round(usagePercentages.ai_requests)}% of your AI request quota`,
      severity: usagePercentages.ai_requests > 95 ? 'high' : 'medium'
    });
  }

  if (trends.summaries > 50) {
    recommendations.push({
      type: 'optimization',
      message: 'Your usage is growing rapidly. Consider setting up automated summaries.',
      action: 'setup_automation'
    });
  }

  return {
    current_period: {
      start_date: new Date(currentYear, currentMonth, 1).toISOString(),
      end_date: new Date(currentYear, currentMonth + 1, 0).toISOString(),
      usage: baseUsage,
      limits: limits,
      percentages: usagePercentages,
    },
    plan: {
      name: currentPlan,
      display_name: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
      billing_cycle: 'monthly',
      next_reset: new Date(currentYear, currentMonth + 1, 1).toISOString(),
    },
    historical: historicalData,
    trends: trends,
    warnings: warnings,
    recommendations: recommendations,
    quota_resets_in: Math.ceil((new Date(currentYear, currentMonth + 1, 1).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    cost_breakdown: {
      base_plan: currentPlan === 'free' ? 0 : currentPlan === 'pro' ? 29 : 99,
      overage_charges: 0, // No overages in demo
      total: currentPlan === 'free' ? 0 : currentPlan === 'pro' ? 29 : 99,
      currency: 'USD'
    }
  };
}

async function fetchUserUsage(supabase: any, userId: string, period: string) {
  // This would implement real usage fetching from the database
  // For now, return the mock data
  return generateMockUsage(period);
}
