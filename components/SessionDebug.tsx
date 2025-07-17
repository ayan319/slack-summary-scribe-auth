'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';

interface SessionDebugInfo {
  hasSession: boolean;
  sessionError: string | null;
  userId: string | null;
  email: string | null;
  expiresAt: string | null;
  cookies: Record<string, string>;
  userContextState: {
    user: any;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  sessionDetails: {
    accessToken: string | null;
    refreshToken: string | null;
    tokenType: string | null;
    expiresIn: number | null;
    isExpired: boolean;
    timeUntilExpiry: string | null;
  };
  cookieDetails: {
    domain: string | null;
    path: string | null;
    secure: boolean;
    sameSite: string | null;
    httpOnly: boolean;
  };
}

export default function SessionDebug() {
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo | null>(null);
  const { user, isLoading, isAuthenticated } = useUser();

  useEffect(() => {
    const updateDebugInfo = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // Get cookies with detailed analysis
        const cookies = typeof window !== 'undefined'
          ? document.cookie.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              if (key.includes('sb-') || key.includes('supabase')) {
                acc[key] = value ? 'present' : 'missing';
              }
              return acc;
            }, {} as Record<string, string>)
          : {};

        // Analyze session details
        const sessionDetails = session ? {
          accessToken: session.access_token ? 'present' : null,
          refreshToken: session.refresh_token ? 'present' : null,
          tokenType: session.token_type || null,
          expiresIn: session.expires_in || null,
          isExpired: session.expires_at ? session.expires_at < Date.now() / 1000 : false,
          timeUntilExpiry: session.expires_at
            ? Math.max(0, Math.floor((session.expires_at * 1000 - Date.now()) / 1000)) + 's'
            : null
        } : {
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          expiresIn: null,
          isExpired: true,
          timeUntilExpiry: null
        };

        // Analyze cookie settings (simulated - actual cookie attributes aren't accessible via JS)
        const cookieDetails = {
          domain: typeof window !== 'undefined' ? window.location.hostname : null,
          path: '/',
          secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
          sameSite: 'lax', // Default for Supabase
          httpOnly: false // JS accessible cookies are not httpOnly
        };

        setDebugInfo({
          hasSession: !!session,
          sessionError: sessionError?.message || null,
          userId: session?.user?.id || null,
          email: session?.user?.email || null,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          cookies,
          userContextState: {
            user: user ? { id: user.id, email: user.email } : null,
            isLoading,
            isAuthenticated
          },
          sessionDetails,
          cookieDetails
        });
      } catch (error) {
        console.error('Debug info error:', error);
      }
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [user, isLoading, isAuthenticated]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !debugInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔍 Session Debug</h3>
      
      <div className="space-y-1">
        <div>
          <strong>Session:</strong> {debugInfo.hasSession ? '✅ Active' : '❌ None'}
        </div>
        
        {debugInfo.sessionError && (
          <div className="text-red-400">
            <strong>Error:</strong> {debugInfo.sessionError}
          </div>
        )}
        
        <div>
          <strong>User ID:</strong> {debugInfo.userId || 'None'}
        </div>
        
        <div>
          <strong>Email:</strong> {debugInfo.email || 'None'}
        </div>
        
        <div>
          <strong>Expires:</strong> {debugInfo.expiresAt || 'None'}
        </div>
        
        <div>
          <strong>Context Loading:</strong> {debugInfo.userContextState.isLoading ? '⏳ Yes' : '✅ No'}
        </div>
        
        <div>
          <strong>Context Auth:</strong> {debugInfo.userContextState.isAuthenticated ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Context User:</strong> {debugInfo.userContextState.user?.email || 'None'}
        </div>
        
        <div>
          <strong>Session Details:</strong>
          <div className="ml-2 text-xs">
            <div>Access Token: {debugInfo.sessionDetails.accessToken || 'None'}</div>
            <div>Refresh Token: {debugInfo.sessionDetails.refreshToken || 'None'}</div>
            <div>Token Type: {debugInfo.sessionDetails.tokenType || 'None'}</div>
            <div>Expires In: {debugInfo.sessionDetails.expiresIn || 'None'}</div>
            <div>Is Expired: {debugInfo.sessionDetails.isExpired ? '❌ Yes' : '✅ No'}</div>
            <div>Time Until Expiry: {debugInfo.sessionDetails.timeUntilExpiry || 'None'}</div>
          </div>
        </div>

        <div>
          <strong>Cookie Settings:</strong>
          <div className="ml-2 text-xs">
            <div>Domain: {debugInfo.cookieDetails.domain || 'None'}</div>
            <div>Path: {debugInfo.cookieDetails.path}</div>
            <div>Secure: {debugInfo.cookieDetails.secure ? '✅ Yes' : '❌ No'}</div>
            <div>SameSite: {debugInfo.cookieDetails.sameSite}</div>
            <div>HttpOnly: {debugInfo.cookieDetails.httpOnly ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        <div>
          <strong>Cookies:</strong>
          <div className="ml-2 text-xs">
            {Object.keys(debugInfo.cookies).length > 0
              ? Object.entries(debugInfo.cookies).map(([key, value]) => (
                  <div key={key}>{key}: {value}</div>
                ))
              : 'None found'
            }
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs opacity-70">
        Updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
