import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Slack Summary Scribe API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      auth: '/api/auth',
      slack: '/api/slack'
    },
    documentation: '/docs'
  });
}

export async function POST() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
}
