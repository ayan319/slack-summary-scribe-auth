import { NextRequest, NextResponse } from 'next/server';
import { updateLaunchTrackerMetrics, createLaunchTrackerItem } from '@/lib/notion';
import type { LaunchTrackerItem } from '@/lib/notion';

// Product Hunt metrics sync endpoint
export async function POST(request: NextRequest) {
  try {
    const { metrics, pageId, createNew } = await request.json();
    
    // Validate input
    if (!metrics) {
      return NextResponse.json(
        { error: 'Metrics data is required' },
        { status: 400 }
      );
    }
    
    if (createNew) {
      // Create new Product Hunt tracking item
      const newItem: LaunchTrackerItem = {
        title: 'Product Hunt Launch - Live Metrics',
        status: 'In Progress',
        category: 'Product Hunt Metrics',
        priority: 'High',
        description: 'Real-time Product Hunt launch metrics tracking',
        metrics: {
          upvotes: metrics.upvotes || 0,
          comments: metrics.comments || 0,
          signups: metrics.signups || 0,
          conversions: metrics.conversions || 0,
        },
      };
      
      const createdItem = await createLaunchTrackerItem(newItem);
      
      return NextResponse.json({
        success: true,
        message: 'New Product Hunt tracking item created',
        pageId: createdItem.id,
        metrics: newItem.metrics,
      });
    } else {
      // Update existing item
      if (!pageId) {
        return NextResponse.json(
          { error: 'Page ID is required for updates' },
          { status: 400 }
        );
      }
      
      await updateLaunchTrackerMetrics(pageId, metrics);
      
      return NextResponse.json({
        success: true,
        message: 'Metrics updated successfully',
        pageId,
        metrics,
      });
    }
    
  } catch (error) {
    console.error('Error syncing metrics to Notion:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get current metrics from Notion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }
    
    // This would typically fetch from Notion, but for now return a placeholder
    // In a real implementation, you'd query the specific page and extract metrics
    
    return NextResponse.json({
      success: true,
      pageId,
      metrics: {
        upvotes: 0,
        comments: 0,
        signups: 0,
        conversions: 0,
      },
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching metrics from Notion:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
