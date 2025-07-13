/**
 * Server-side authentication utilities for API routes
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider?: string;
}

/**
 * Get authenticated user from API request
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            if (request) {
              return request.cookies.get(name)?.value;
            }
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
      avatar_url: session.user.user_metadata?.avatar_url,
      provider: session.user.app_metadata?.provider
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication for API route
 */
export async function requireAuthentication(request?: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Get user with organization access
 */
export async function getUserWithOrganization(
  organizationId: string,
  requiredRole: 'owner' | 'admin' | 'member' = 'member',
  request?: NextRequest
): Promise<{ user: AuthenticatedUser; role: string } | null> {
  try {
    const user = await requireAuthentication(request);
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get(name: string) {
            if (request) {
              return request.cookies.get(name)?.value;
            }
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check user's role in organization
    const { data, error } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if user has required role
    const roleHierarchy = { owner: 3, admin: 2, member: 1 };
    const userRoleLevel = roleHierarchy[data.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return null;
    }

    return { user, role: data.role };
  } catch (error) {
    console.error('Error checking organization access:', error);
    return null;
  }
}

/**
 * Validate API key authentication (for external integrations)
 */
export async function validateApiKey(apiKey: string): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
        },
      }
    );

    // Check if API key exists and is active
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        user_id,
        active,
        user:users (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('key_hash', apiKey)
      .eq('active', true)
      .single();

    if (error || !data || !data.user || !Array.isArray(data.user) || data.user.length === 0) {
      return null;
    }

    const user = data.user[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      provider: 'api_key'
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Extract user ID from various authentication methods
 */
export async function extractUserId(request: NextRequest): Promise<string | null> {
  // Method 1: Session authentication
  const sessionUser = await getAuthenticatedUser(request);
  if (sessionUser) {
    return sessionUser.id;
  }

  // Method 2: API key authentication
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7);
    const apiUser = await validateApiKey(apiKey);
    if (apiUser) {
      return apiUser.id;
    }
  }

  // Method 3: API key in query params (for webhooks)
  const { searchParams } = new URL(request.url);
  const queryApiKey = searchParams.get('api_key');
  if (queryApiKey) {
    const apiUser = await validateApiKey(queryApiKey);
    if (apiUser) {
      return apiUser.id;
    }
  }

  return null;
}

/**
 * Create authentication response helpers
 */
export const AuthResponse = {
  unauthorized: (message = 'Authentication required') => {
    return Response.json(
      { error: message, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  },

  forbidden: (message = 'Access denied') => {
    return Response.json(
      { error: message, code: 'FORBIDDEN' },
      { status: 403 }
    );
  },

  invalidSession: (message = 'Invalid or expired session') => {
    return Response.json(
      { error: message, code: 'INVALID_SESSION' },
      { status: 401 }
    );
  },

  rateLimited: (message = 'Rate limit exceeded') => {
    return Response.json(
      { error: message, code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }
};

/**
 * Middleware wrapper for API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAuthentication(request);
      return await handler(request, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return AuthResponse.unauthorized();
    }
  };
}

/**
 * Middleware wrapper for organization-scoped API routes
 */
export function withOrganizationAuth(
  handler: (
    request: NextRequest, 
    user: AuthenticatedUser, 
    organizationId: string,
    role: string
  ) => Promise<Response>,
  requiredRole: 'owner' | 'admin' | 'member' = 'member'
) {
  return async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId') || 
                           searchParams.get('organization_id');

      if (!organizationId) {
        return Response.json(
          { error: 'Organization ID required' },
          { status: 400 }
        );
      }

      const result = await getUserWithOrganization(organizationId, requiredRole, request);
      
      if (!result) {
        return AuthResponse.forbidden('Access denied to organization');
      }

      return await handler(request, result.user, organizationId, result.role);
    } catch (error) {
      console.error('Organization authentication error:', error);
      return AuthResponse.unauthorized();
    }
  };
}
