import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { seedDemoData } from '@/scripts/seed-demo-data';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user already has demo data
    const { data: existingSummaries } = await supabase
      .from('summaries')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingSummaries && existingSummaries.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Demo data already exists for this user'
      });
    }

    // Seed demo data
    try {
      await seedDemoData();

      return NextResponse.json({
        success: true,
        message: 'Demo data created successfully'
      });
    } catch (error) {
      console.error('Seed demo data error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create demo data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Seed demo API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete all demo data for the user
    const deleteOperations = [
      supabase.from('summaries').delete().eq('user_id', userId),
      supabase.from('notifications').delete().eq('user_id', userId),
      supabase.from('user_activities').delete().eq('user_id', userId),
      supabase.from('onboarding_steps').delete().eq('user_id', userId)
    ];

    await Promise.all(deleteOperations);

    return NextResponse.json({
      success: true,
      message: 'Demo data cleared successfully'
    });

  } catch (error) {
    console.error('Clear demo API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
