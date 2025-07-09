import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logUserSignup } from '@/lib/workspace-logger';

export async function GET(request: NextRequest) {
  console.log('🔄 Auth callback called');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  console.log('📝 Callback details:', {
    hasCode: !!code,
    origin,
    fullUrl: request.url
  });

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      console.log('🔄 Exchanging code for session...');
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ Auth callback failed:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
      }

      // Check if we have a valid session
      if (data.session && data.user) {
        console.log('✅ Auth callback successful for user:', data.user.email);

        // Log user signup for monitoring
        try {
          await logUserSignup(
            data.user.id,
            data.user.email || 'unknown@email.com',
            data.user.app_metadata?.provider || 'unknown',
            {
              full_name: data.user.user_metadata?.full_name,
              avatar_url: data.user.user_metadata?.avatar_url,
              callback_source: 'oauth'
            }
          );
        } catch (logError) {
          console.warn('Failed to log user signup:', logError);
        }

        // Create user profile if it doesn't exist
        try {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              avatar_url: data.user.user_metadata?.avatar_url || null,
              provider: data.user.app_metadata?.provider || 'google'
            }, { onConflict: 'id' });

          if (profileError) {
            console.warn('Could not create/update user profile:', profileError);
            // Continue anyway - profile creation is not critical for auth
          }
        } catch (profileError) {
          console.warn('Error creating user profile:', profileError);
          // Continue anyway - profile creation is not critical for auth
        }

        // Successfully authenticated - redirect to dashboard
        // The AuthProvider will handle redirecting to onboarding if no organizations exist
        console.log('🚀 Redirecting to dashboard');
        return NextResponse.redirect(`${origin}/dashboard`);
      } else {
        console.error('No session or user data received');
        return NextResponse.redirect(`${origin}/login?error=no_session`);
      }
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(`${origin}/login?error=callback_exception`);
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code_provided`);
}
