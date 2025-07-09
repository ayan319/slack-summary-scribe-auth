import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚨 WARNING: /api/auth/signup1 was called - this route should not exist!');
  console.log('🔍 Request URL:', request.url);
  console.log('🔍 Request method:', request.method);
  console.log('🔍 Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('📝 Request body:', body);
  } catch (error) {
    console.log('❌ Failed to parse request body:', error);
  }

  return NextResponse.json(
    { 
      success: false, 
      error: 'This endpoint does not exist. Use /api/auth/signup instead.',
      correctEndpoint: '/api/auth/signup'
    },
    { status: 404 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'This endpoint does not exist. Use /api/auth/signup instead.',
      correctEndpoint: '/api/auth/signup'
    },
    { status: 404 }
  );
}
