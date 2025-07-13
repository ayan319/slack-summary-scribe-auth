import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics Metrics API: Auth disabled - returning demo data');

    // Demo usage metrics
    const metrics = {
      totalSummaries: 127,
      totalMessages: 3456,
      totalUsers: 12,
      averageProcessingTime: 1250,
      topChannels: [
        { name: '#general', count: 45 },
        { name: '#product', count: 32 },
        { name: '#engineering', count: 28 },
        { name: '#marketing', count: 22 }
      ],
      summariesByMonth: [
        { month: '2024-01', count: 23 },
        { month: '2024-02', count: 34 },
        { month: '2024-03', count: 28 },
        { month: '2024-04', count: 42 }
      ],
      aiModelUsage: {
        'deepseek-chat': 85,
        'gpt-4o-mini': 42
      }
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Analytics metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
