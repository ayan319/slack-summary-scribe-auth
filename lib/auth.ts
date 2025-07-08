import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

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
export async function signInWithOAuth(provider: 'google') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
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
          full_name: name,
          name: name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`,
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
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Resend email verification
 */
export async function resendVerification(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  // Redirect to login page
  window.location.href = '/login';
}



/**
 * Get current user session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!,
    avatar_url: user.user_metadata?.avatar_url,
    provider: user.app_metadata?.provider,
  };
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    // First check if tables exist by trying a simple query
    const { data, error } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations (
          id,
          name
        )
      `)
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error fetching user organizations:', error || 'No data returned');
      return [];
    }

    if (data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.organizations?.id || '',
      name: item.organizations?.name || 'Unknown Organization',
      slug: item.organizations?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      role: item.role,
    }));
  } catch (error) {
    console.error('getUserOrganizations error:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

/**
 * Create a new organization
 */
export async function createOrganization(name: string, userId: string): Promise<Organization> {
  try {
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: org.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding user to organization:', memberError);
      throw new Error(`Failed to add user to organization: ${memberError.message}`);
    }

    return {
      id: org.id as string,
      name: org.name as string,
      slug: slug,
      role: 'owner',
    };
  } catch (error) {
    console.error('createOrganization error:', error);
    throw error;
  }
}

/**
 * Invite user to organization
 */
export async function inviteUserToOrganization(
  email: string,
  organizationId: string,
  role: 'admin' | 'member' = 'member'
) {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    // Add existing user to organization
    const { error } = await supabase
      .from('user_organizations')
      .insert({
        user_id: existingUser.id,
        organization_id: organizationId,
        role,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  // TODO: Send invitation email
  return { success: true, userExists: !!existingUser };
}

/**
 * Switch to organization
 */
export async function switchOrganization(organizationId: string) {
  // Store current organization in localStorage
  localStorage.setItem('currentOrganization', organizationId);

  // Trigger a page refresh to update the context
  window.location.reload();
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
  return supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    if (session?.user) {
      const authUser = await getCurrentUser();
      callback(authUser);
    } else {
      callback(null);
    }
  });
}

/**
 * Check if user has permission in organization
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  requiredRole: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_organizations')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return false;
  }

  const roleHierarchy: Record<string, number> = { owner: 3, admin: 2, member: 1 };
  return roleHierarchy[data.role as string] >= roleHierarchy[requiredRole];
}
