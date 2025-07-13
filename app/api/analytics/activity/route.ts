import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics Activity API: Auth disabled - returning demo data');

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Generate demo activity data
    const activityData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        summaries: Math.floor(Math.random() * 10) + 1,
        messages: Math.floor(Math.random() * 100) + 20,
        users: Math.floor(Math.random() * 5) + 1,
      };
    }).reverse();

    return NextResponse.json({
      success: true,
      data: activityData
    });

  } catch (error) {
    console.error('Analytics activity API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
