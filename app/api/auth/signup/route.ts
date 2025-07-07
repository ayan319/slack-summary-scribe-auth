import { NextRequest, NextResponse } from 'next/server';
import { signUpWithEmail } from '@/lib/auth';
import { validateEmail, validatePassword, rateLimiters, getClientIdentifier } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimiters.auth.checkLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many signup attempts. Please try again in ${Math.ceil(rateLimitResult.resetTime / 60)} minutes.` 
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

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
    const result = await signUpWithEmail(email, password, name);
    
    if (!result.success) {
      // Record failed attempt
      rateLimiters.auth.recordAttempt(clientId);
      
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Success - create response
    const response = NextResponse.json({
      success: true,
      message: result.needsVerification 
        ? 'Account created! Please check your email to verify your account.' 
        : 'Account created successfully!',
      user: result.user,
      needsVerification: result.needsVerification
    });

    // Set session cookie if available and no verification needed
    if (result.session && !result.needsVerification) {
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
