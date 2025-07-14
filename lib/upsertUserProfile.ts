/**
 * Safe client-side Supabase profile upsert utility
 * 
 * Purpose: Safely upsert user profile data using Supabase RPC function
 * to avoid 403 Forbidden errors and 400 Bad Request issues.
 * 
 * This function calls the `upsert_user_profile` RPC function which has
 * SECURITY DEFINER privileges to bypass RLS restrictions during profile creation.
 * 
 * @example
 * ```typescript
 * import { upsertUserProfile } from '@/lib/upsertUserProfile';
 * 
 * useEffect(() => {
 *   if (session?.user) {
 *     upsertUserProfile({
 *       name: session.user.user_metadata?.name,
 *       avatar_url: session.user.user_metadata?.avatar_url
 *     });
 *   }
 * }, [session?.user]);
 * ```
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Initialize Supabase client
const supabase = createClientComponentClient();

/**
 * User profile data interface
 */
interface UserProfileData {
  name?: string | null;
  avatar_url?: string | null;
}

/**
 * Safely upsert user profile using Supabase RPC function
 * 
 * @param user - User profile data to upsert
 * @param user.name - User's display name (optional)
 * @param user.avatar_url - User's avatar URL (optional)
 * @returns Promise<void>
 * 
 * @throws Will log errors but not throw to avoid breaking the application flow
 */
export async function upsertUserProfile(user: UserProfileData): Promise<void> {
  try {
    // Validate that we have a user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('[upsertUserProfile] Session error:', sessionError.message);
      return;
    }
    
    if (!session?.user) {
      console.warn('[upsertUserProfile] No authenticated user found');
      return;
    }

    // Prepare parameters for RPC call
    const rpcParams = {
      user_name: user?.name ?? null,
      user_avatar_url: user?.avatar_url ?? null
    };

    // Log the attempt for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[upsertUserProfile] Attempting to upsert profile:', {
        userId: session.user.id,
        email: session.user.email,
        params: rpcParams
      });
    }

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc('upsert_user_profile', rpcParams);

    if (error) {
      // Log the error for debugging but don't throw
      console.error('[upsertUserProfile] RPC error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Provide helpful error context
      if (error.code === 'PGRST116') {
        console.error('[upsertUserProfile] Function not found. Ensure the migration has been applied.');
      } else if (error.code === '42501') {
        console.error('[upsertUserProfile] Permission denied. Check RLS policies and function permissions.');
      }
      
      return;
    }

    // Log success
    if (process.env.NODE_ENV === 'development') {
      console.log('[upsertUserProfile] Profile upserted successfully:', data);
    }

  } catch (error) {
    // Catch any unexpected errors
    console.error('[upsertUserProfile] Unexpected error:', error);
    
    // Don't throw the error to avoid breaking the application flow
    // The user should still be able to use the app even if profile sync fails
  }
}

/**
 * Upsert user profile with data from Supabase auth user object
 * 
 * @param authUser - Supabase auth user object
 * @returns Promise<void>
 */
export async function upsertUserProfileFromAuth(authUser: any): Promise<void> {
  if (!authUser) {
    console.warn('[upsertUserProfileFromAuth] No auth user provided');
    return;
  }

  // Extract user metadata safely
  const metadata = authUser.user_metadata || {};
  
  const profileData: UserProfileData = {
    name: metadata.name || metadata.full_name || null,
    avatar_url: metadata.avatar_url || metadata.picture || null
  };

  await upsertUserProfile(profileData);
}

/**
 * Check if the upsert_user_profile RPC function exists
 * Useful for debugging migration issues
 * 
 * @returns Promise<boolean>
 */
export async function checkUpsertFunctionExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('upsert_user_profile', {
      user_name: null,
      user_avatar_url: null
    });

    if (error && error.code === 'PGRST116') {
      console.error('[checkUpsertFunctionExists] Function does not exist. Apply the migration first.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[checkUpsertFunctionExists] Error checking function:', error);
    return false;
  }
}
