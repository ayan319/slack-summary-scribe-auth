import { NextApiRequest } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserContext {
  userId: string;
  teamId: string;
  userEmail?: string;
  teamName?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  isValid: boolean;
  source: 'session' | 'webhook' | 'api_key' | 'fallback';
}

/**
 * Extract user context from various sources with fallbacks
 */
export async function getUserContext(req: NextApiRequest): Promise<UserContext> {
  // Strategy 1: Extract from Authorization header (API key or JWT)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const context = await extractFromAuthHeader(authHeader);
    if (context.isValid) return context;
  }

  // Strategy 2: Extract from Slack webhook headers
  const slackUserId = req.headers['x-slack-user-id'] as string;
  const slackTeamId = req.headers['x-slack-team-id'] as string;
  if (slackUserId && slackTeamId) {
    return await extractFromSlackHeaders(slackUserId, slackTeamId);
  }

  // Strategy 3: Extract from request body (Slack webhook payload)
  if (req.body?.event?.user && req.body?.team_id) {
    return await extractFromSlackPayload(req.body.event.user, req.body.team_id);
  }

  // Strategy 4: Extract from session cookie
  const sessionContext = await extractFromSession(req);
  if (sessionContext.isValid) return sessionContext;

  // Strategy 5: Extract from request body (manual API calls)
  if (req.body?.userId) {
    return await extractFromRequestBody(req.body);
  }

  // Strategy 6: Fallback to anonymous user
  return createFallbackContext();
}

/**
 * Extract context from Authorization header
 */
async function extractFromAuthHeader(authHeader: string): Promise<UserContext> {
  try {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try to verify JWT token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        // Get user's team information
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('team_id, plan')
          .eq('user_id', user.id)
          .single();

        return {
          userId: user.id,
          teamId: profile?.team_id || `team-${user.id}`,
          userEmail: user.email,
          plan: profile?.plan || 'free',
          isValid: true,
          source: 'session'
        };
      }
    }

    // Try API key format
    if (authHeader.startsWith('sk-')) {
      const { data: apiKey } = await supabase
        .from('api_keys')
        .select('user_id, team_id, is_active')
        .eq('key_hash', hashApiKey(authHeader))
        .eq('is_active', true)
        .single();

      if (apiKey) {
        return {
          userId: apiKey.user_id,
          teamId: apiKey.team_id,
          isValid: true,
          source: 'api_key'
        };
      }
    }
  } catch (error) {
    console.error('Error extracting from auth header:', error);
  }

  return createInvalidContext();
}

/**
 * Extract context from Slack headers
 */
async function extractFromSlackHeaders(slackUserId: string, slackTeamId: string): Promise<UserContext> {
  try {
    // Look up user by Slack ID
    const { data: slackUser } = await supabase
      .from('slack_users')
      .select('user_id, team_id')
      .eq('slack_user_id', slackUserId)
      .eq('slack_team_id', slackTeamId)
      .single();

    if (slackUser) {
      return {
        userId: slackUser.user_id,
        teamId: slackUser.team_id,
        isValid: true,
        source: 'webhook'
      };
    }

    // Create new user if not exists
    return await createSlackUser(slackUserId, slackTeamId);
  } catch (error) {
    console.error('Error extracting from Slack headers:', error);
    return createInvalidContext();
  }
}

/**
 * Extract context from Slack webhook payload
 */
async function extractFromSlackPayload(slackUserId: string, slackTeamId: string): Promise<UserContext> {
  return await extractFromSlackHeaders(slackUserId, slackTeamId);
}

/**
 * Extract context from session cookie
 */
async function extractFromSession(req: NextApiRequest): Promise<UserContext> {
  try {
    // Extract session token from cookies
    const sessionToken = req.cookies['supabase-auth-token'] || req.cookies['sb-access-token'];
    
    if (sessionToken) {
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
      
      if (user && !error) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('team_id, plan')
          .eq('user_id', user.id)
          .single();

        return {
          userId: user.id,
          teamId: profile?.team_id || `team-${user.id}`,
          userEmail: user.email,
          plan: profile?.plan || 'free',
          isValid: true,
          source: 'session'
        };
      }
    }
  } catch (error) {
    console.error('Error extracting from session:', error);
  }

  return createInvalidContext();
}

/**
 * Extract context from request body
 */
async function extractFromRequestBody(body: any): Promise<UserContext> {
  try {
    const userId = body.userId;
    const teamId = body.teamId || `team-${userId}`;

    // Validate user exists
    const { data: user } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (user) {
      return {
        userId,
        teamId,
        plan: user.plan || 'free',
        isValid: true,
        source: 'api_key'
      };
    }

    // Create minimal context for new users
    return {
      userId,
      teamId,
      plan: 'free',
      isValid: true,
      source: 'fallback'
    };
  } catch (error) {
    console.error('Error extracting from request body:', error);
    return createInvalidContext();
  }
}

/**
 * Create a new Slack user
 */
async function createSlackUser(slackUserId: string, slackTeamId: string): Promise<UserContext> {
  try {
    const userId = `slack-${slackUserId}`;
    const teamId = `slack-team-${slackTeamId}`;

    // Insert into slack_users table
    await supabase
      .from('slack_users')
      .upsert({
        slack_user_id: slackUserId,
        slack_team_id: slackTeamId,
        user_id: userId,
        team_id: teamId,
        created_at: new Date().toISOString()
      });

    // Create user profile
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        team_id: teamId,
        plan: 'free',
        created_at: new Date().toISOString()
      });

    return {
      userId,
      teamId,
      plan: 'free',
      isValid: true,
      source: 'webhook'
    };
  } catch (error) {
    console.error('Error creating Slack user:', error);
    return createInvalidContext();
  }
}

/**
 * Create fallback context for anonymous users
 */
function createFallbackContext(): UserContext {
  const timestamp = Date.now();
  return {
    userId: `anonymous-${timestamp}`,
    teamId: `anonymous-team-${timestamp}`,
    plan: 'free',
    isValid: true,
    source: 'fallback'
  };
}

/**
 * Create invalid context
 */
function createInvalidContext(): UserContext {
  return {
    userId: '',
    teamId: '',
    isValid: false,
    source: 'fallback'
  };
}

/**
 * Hash API key for storage
 */
function hashApiKey(apiKey: string): string {
  // Simple hash for demo - use proper crypto in production
  return Buffer.from(apiKey).toString('base64');
}

/**
 * Check if user has reached summary limits
 */
export async function checkSummaryLimits(userId: string, plan: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetDate: string;
}> {
  const limits = {
    free: 3,
    pro: 100,
    enterprise: -1 // unlimited
  };

  const limit = limits[plan as keyof typeof limits] || limits.free;
  
  if (limit === -1) {
    return {
      allowed: true,
      used: 0,
      limit: -1,
      resetDate: ''
    };
  }

  // Count summaries this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('summaries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const used = count || 0;
  const allowed = used < limit;

  // Calculate reset date (first day of next month)
  const resetDate = new Date(startOfMonth);
  resetDate.setMonth(resetDate.getMonth() + 1);

  return {
    allowed,
    used,
    limit,
    resetDate: resetDate.toISOString()
  };
}
