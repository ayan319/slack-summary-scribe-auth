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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        user: null,
        session: null,
        needsVerification: false
      };
    }

    // Check if email confirmation is required
    const needsVerification = !data.session && data.user && !data.user.email_confirmed_at;

    return {
      success: true,
      error: null,
      user: data.user,
      session: data.session,
      needsVerification
    };
  } catch (error) {
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
 * Get current user session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
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
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
