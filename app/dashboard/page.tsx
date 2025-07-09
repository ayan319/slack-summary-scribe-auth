"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cookies, setCookies] = useState<any>({});
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log("🔍 Dashboard: Initializing and checking session...");
    const supabase = createBrowserSupabaseClient();

    // Check cookies
    const checkCookies = () => {
      const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as any);

      const supabaseCookies = Object.keys(allCookies)
        .filter(key => key.includes('sb-') || key.includes('supabase'))
        .reduce((acc, key) => {
          acc[key] = allCookies[key];
          return acc;
        }, {} as any);

      console.log("🍪 Dashboard: All cookies:", Object.keys(allCookies));
      console.log("🍪 Dashboard: Supabase cookies:", supabaseCookies);
      setCookies(supabaseCookies);

      return supabaseCookies;
    };

    const getSession = async () => {
      try {
        // Check cookies first
        const cookieData = checkCookies();

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Dashboard: Session error:", error);
          setError(error.message);
          setDebugInfo({
            error: error.message,
            cookies: cookieData,
            timestamp: new Date().toISOString()
          });
          return;
        }

        console.log("📝 Dashboard: Session data:", {
          hasSession: !!data.session,
          user: data.session?.user?.email,
          sessionId: data.session?.access_token?.substring(0, 20) + '...'
        });

        setSession(data.session);
        setDebugInfo({
          sessionExists: !!data.session,
          userEmail: data.session?.user?.email,
          userId: data.session?.user?.id,
          provider: data.session?.user?.app_metadata?.provider,
          cookies: cookieData,
          timestamp: new Date().toISOString(),
          expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null
        });
      } catch (err) {
        console.error("❌ Dashboard: Exception getting session:", err);
        setError("Failed to retrieve session");
        setDebugInfo({
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("🔄 Dashboard: Auth state changed:", event, {
        hasSession: !!currentSession,
        user: currentSession?.user?.email
      });
      setSession(currentSession);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("❌ Dashboard: Logout error:", error);
      setError("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg">🔄 Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md w-full">
          <p className="text-red-800 text-center">❌ Error: {error}</p>
        </div>
        <Button onClick={() => window.location.href = "/login"}>Return to Login</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md w-full">
          <p className="text-yellow-800 text-center">⚠️ No active session found</p>
        </div>
        <Button onClick={() => window.location.href = "/login"}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">✅ Dashboard - Session Debug Mode</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} variant="outline">🔄 Refresh</Button>
          <Button onClick={handleLogout}>🚪 Sign Out</Button>
        </div>
      </div>

      {/* Debug Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-green-900 mb-4">🎉 Session Debug Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Session Status</h3>
            <p className="text-2xl font-bold text-green-600">✅ Active</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">User Email</h3>
            <p className="text-lg font-semibold">{session.user?.email}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Auth Provider</h3>
            <p className="text-lg font-semibold">{session.user?.app_metadata?.provider || 'email'}</p>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">🔍 Debug Information</h2>
        <div className="bg-blue-50 p-4 rounded-md overflow-auto">
          <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>

      {/* Cookies Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">🍪 Supabase Cookies</h2>
        {Object.keys(cookies).length > 0 ? (
          <div className="bg-yellow-50 p-4 rounded-md overflow-auto">
            <pre className="text-sm">{JSON.stringify(cookies, null, 2)}</pre>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md">
            <p className="text-red-800">⚠️ No Supabase cookies found! This may indicate a session issue.</p>
          </div>
        )}
      </div>

      {/* Full Session Data */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">📄 Complete Session Data</h2>
        <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
          <pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>

      {/* User Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">👤 User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p><strong>User ID:</strong> {session.user?.id}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Provider:</strong> {session.user?.app_metadata?.provider || 'email'}</p>
            <p><strong>Email Verified:</strong> {session.user?.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Created At:</strong> {new Date(session.user?.created_at).toLocaleString()}</p>
            <p><strong>Last Sign In:</strong> {session.user?.last_sign_in_at ? new Date(session.user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Session Expires:</strong> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
            <p><strong>Role:</strong> {session.user?.role || 'authenticated'}</p>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium mb-4">🧪 Test Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.location.href = '/'} variant="outline">🏠 Go to Home</Button>
          <Button onClick={() => window.location.href = '/pricing'} variant="outline">💰 Go to Pricing</Button>
          <Button onClick={() => console.log('Current session:', session)} variant="outline">📝 Log Session to Console</Button>
          <Button onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(session, null, 2));
            alert('Session data copied to clipboard!');
          }} variant="outline">📋 Copy Session Data</Button>
        </div>
      </div>
    </div>
  );
}
