import { NextRequest, NextResponse } from 'next/server';
import { signUpWithEmail } from '@/lib/auth';
import { validateEmail, validatePassword, rateLimiters, getClientIdentifier } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Signup API called - URL:', request.url);
    console.log('🔍 Request method:', request.method);
    console.log('🔍 Content-Type:', request.headers.get('content-type'));

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimiters.auth.checkLimit(clientId);

    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded for client:', clientId);
      return NextResponse.json(
        {
          success: false,
          error: `Too many signup attempts. Please try again in ${Math.ceil(rateLimitResult.resetTime / 60)} minutes.`
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    console.log('📝 Request body received:', {
      hasName: !!body.name,
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      bodyKeys: Object.keys(body)
    });

    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      console.log('❌ Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    console.log('✅ All required fields present for email:', email);

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Attempt sign up
    console.log('🚀 Attempting signup for email:', email);
    const result = await signUpWithEmail(email, password, name);

    if (!result.success) {
      console.log('❌ Signup failed:', result.error);
      // Record failed attempt
      rateLimiters.auth.recordAttempt(clientId);

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ Signup successful:', {
      hasUser: !!result.user,
      hasSession: !!result.session,
      needsVerification: result.needsVerification
    });

    // Success - create response
    const response = NextResponse.json({
      success: true,
      message: result.needsVerification
        ? 'Account created! Please check your email to verify your account.'
        : 'Account created successfully!',
      user: result.user,
      session: result.session,
      needsVerification: result.needsVerification,
      redirectTo: result.needsVerification ? null : '/dashboard'
    });

    // Set session cookie if available and no verification needed
    if (result.session && !result.needsVerification) {
      console.log('🍪 Setting session cookies');
      response.cookies.set('sb-access-token', result.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      response.cookies.set('sb-refresh-token', result.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response;

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
