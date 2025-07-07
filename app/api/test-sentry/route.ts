import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Add some context for testing
    Sentry.setTag('test-route', 'sentry-validation');
    Sentry.setContext('test-info', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      url: request.url,
    });

    // Add a breadcrumb
    Sentry.addBreadcrumb({
      message: 'Sentry test route accessed',
      category: 'test',
      level: 'info',
      data: {
        method: request.method,
        url: request.url,
      },
    });

    // Check if we should throw an error for testing
    const shouldError = request.nextUrl.searchParams.get('error');
    
    if (shouldError === 'true') {
      // Intentionally throw an error to test Sentry capture
      throw new Error('Test error for Sentry validation - this is intentional');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Sentry test route is working',
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'missing',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        route: 'test-sentry',
        intentional: 'true',
      },
      extra: {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'missing',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test Sentry with custom data
    Sentry.setTag('test-type', 'custom-data');
    Sentry.setContext('request-body', body);
    
    if (body.testError) {
      throw new Error(`Custom test error: ${body.testError}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    Sentry.captureException(error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
