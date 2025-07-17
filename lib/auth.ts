import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: 'google' | 'github' | 'slack') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, name?: string) {
  try {
    console.log('🚀 Starting signup process for:', email);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name?.trim(),
          full_name: name?.trim(),
        },
      },
    });

    if (error) {
      console.error('❌ Signup error:', error);

      // Handle specific error cases with user-friendly messages
      let errorMessage = error.message;

      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('Signup is disabled')) {
        errorMessage = 'Account creation is currently disabled. Please contact support.';
      }

      return {
        success: false,
        error: errorMessage,
        user: null,
        session: null,
        needsVerification: false
      };
    }

    console.log('✅ Signup successful:', data);

    // Check if email confirmation is required
    const needsVerification = !data.session && data.user && !data.user.email_confirmed_at;

    // If user is immediately signed in, ensure profile is created
    if (data.session && data.user) {
      console.log('🎉 User signed in immediately, ensuring profile exists');

      // Small delay to allow trigger to run
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify profile was created by the trigger
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          console.warn('⚠️ Profile not found, creating manually as fallback');

          // Enhanced fallback: Create profile using client-side upsert with retry logic
          try {
            console.log('🔧 Attempting client-side profile creation...');

            // Wait a moment for the trigger to potentially complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check once more if profile was created by trigger
            const { data: retryProfile, error: retryError } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .eq('id', data.user.id)
              .single();

            if (retryProfile && !retryError) {
              console.log('✅ Profile found on retry - trigger worked');
              return {
                user: data.user,
                session: data.session,
                profile: retryProfile
              };
            }

            // Try using the upsert function as fallback
            const { data: upsertResult, error: upsertError } = await supabase
              .rpc('upsert_user_profile', {
                user_name: name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
                user_avatar_url: data.user.user_metadata?.avatar_url || null
              });

            if (upsertError) {
              console.warn('⚠️ Upsert function failed, trying direct insert:', upsertError.message);

              // Direct insert as fallback
              const { data: insertResult, error: insertError } = await supabase
                .from('users')
                .insert({
                  id: data.user.id,
                  email: data.user.email!,
                  name: name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
                  avatar_url: data.user.user_metadata?.avatar_url || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();

              if (insertError) {
                console.error('❌ Direct insert failed:', insertError.message);
              } else {
                console.log('✅ Profile created via direct insert:', insertResult);
              }
            } else {
              console.log('✅ Profile created via upsert function:', upsertResult);
            }
          } catch (fallbackErr) {
            console.error('❌ All profile creation methods failed:', fallbackErr);
          }
        } else {
          console.log('✅ Profile verified:', profile);
        }
      } catch (profileErr) {
        console.warn('⚠️ Profile verification failed:', profileErr);
      }
    }

    return {
      success: true,
      error: null,
      user: data.user,
      session: data.session,
      needsVerification
    };
  } catch (error) {
    console.error('💥 Signup exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      user: null,
      session: null,
      needsVerification: false
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = error.message;

      // Handle specific error cases
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      }

      return {
        success: false,
        error: errorMessage,
        user: null,
        session: null
      };
    }

    return {
      success: true,
      error: null,
      user: data.user,
      session: data.session
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      user: null,
      session: null
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  return { data, error };
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  return { data, error };
}

/**
 * Resend email verification
 */
export async function resendVerification(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  return { data, error };
}

/**
 * Sign out user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentOrganization');
  }

  return { error };
}

/**
 * Get current user session with enhanced debugging and profile verification
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getCurrentUser: Starting user fetch...');
    }

    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ getCurrentUser: Session error:', sessionError);
      }
      return null;
    }

    if (!session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ getCurrentUser: No session found');
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ getCurrentUser: Session found for user:', session.user?.email);
    }

    // Then get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ getCurrentUser: User fetch error:', userError);
      }
      return null;
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ getCurrentUser: No user in session');
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ getCurrentUser: Auth user found:', user.email);
    }

    // Create the auth user object
    const authUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
      provider: user.app_metadata?.provider
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getCurrentUser: Checking profile in database...');

      // Verify profile exists in database with detailed error handling
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('⚠️ getCurrentUser: Profile fetch error:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });

          // If it's a "not found" error, try to create the profile
          if (profileError.code === 'PGRST116') {
            console.log('🔧 getCurrentUser: Profile not found, attempting to create...');

            try {
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email!,
                  name: authUser.name,
                  avatar_url: authUser.avatar_url,
                  provider: authUser.provider
                })
                .select()
                .single();

              if (createError) {
                console.error('❌ getCurrentUser: Failed to create profile:', createError);
              } else {
                console.log('✅ getCurrentUser: Profile created successfully:', newProfile.email);
              }
            } catch (createErr) {
              console.error('❌ getCurrentUser: Exception creating profile:', createErr);
            }
          }
        } else if (profile) {
          console.log('✅ getCurrentUser: Profile verified in database:', profile.email);
        }
      } catch (profileException) {
        console.error('❌ getCurrentUser: Exception checking profile:', profileException);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ getCurrentUser: Returning auth user:', authUser.email);
    }

    return authUser;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Authentication error:', error);
    }
  }

  return null;
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organization:organizations (
          id,
          name,
          slug,
          avatar_url
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }

    return data.map(item => {
      const org = Array.isArray(item.organization) ? item.organization[0] : item.organization;
      return {
        id: org?.id,
        name: org?.name,
        slug: org?.slug,
        avatar_url: org?.avatar_url,
        role: item.role
      };
    });
  } catch (error) {
    console.error('Error in getUserOrganizations:', error);
    return [];
  }
}

/**
 * Create a new organization (demo mode)
 */
export async function createOrganization(name: string, userId: string): Promise<Organization> {
  console.log('🏢 Create organization (demo mode):', { name, userId });
  
  return {
    id: 'demo-org-' + Date.now(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    role: 'owner'
  };
}

/**
 * Invite user to organization (demo mode)
 */
export async function inviteUserToOrganization(
  email: string,
  organizationId: string,
  role: 'admin' | 'member' = 'member'
) {
  console.log('👥 Invite user (demo mode):', { email, organizationId, role });
  return { success: true };
}

/**
 * Switch to organization (demo mode)
 */
export async function switchOrganization(organizationId: string) {
  console.log('🔄 Switch organization (demo mode):', organizationId);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentOrganization', organizationId);
    window.location.reload();
  }
}

/**
 * Get current organization from localStorage
 */
export function getCurrentOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentOrganization');
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    console.log('Auth state change:', event, session?.user?.email);

    if (session?.user) {
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
        avatar_url: session.user.user_metadata?.avatar_url,
        provider: session.user.app_metadata?.provider
      };
      callback(user);
    } else {
      callback(null);
    }
  });

  return { data: { subscription } };
}

/**
 * Check if user has permission in organization
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  requiredRole: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return false;
    }

    const roleHierarchy = { owner: 3, admin: 2, member: 1 };
    const userRoleLevel = roleHierarchy[data.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}
