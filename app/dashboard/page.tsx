"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎯 Dashboard: Starting session check...');

    // Using the singleton supabase client from lib/supabase

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("📊 Dashboard session check:", { session, error });

      if (error) {
        console.error("❌ Session error:", error);
        setError(error.message);
      } else {
        console.log("✅ Session retrieved:", session ? "User logged in" : "No session");
        setSession(session);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state change:", event, session ? "Session exists" : "No session");
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>🔄 Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h1 className="text-xl font-bold text-red-900 mb-4">❌ Session Error</h1>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h1 className="text-xl font-bold text-yellow-900 mb-4">🔐 No Session</h1>
          <p className="text-yellow-800 mb-4">No active session found. Please log in.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ✅ Dashboard - Session Active
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p>✅ Dashboard page is rendering correctly</p>
            <p>✅ Session retrieved successfully</p>
            <p>✅ User authenticated: {session.user?.email}</p>
            <p>🕐 Session expires: {new Date(session.expires_at * 1000).toISOString()}</p>
            <p>🔑 Provider: {session.user?.app_metadata?.provider || 'email'}</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Session Details
          </h3>
          <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto max-h-64">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh Page
          </button>
          <button
            onClick={() => {
              supabase.auth.signOut().then(() => {
                window.location.href = '/login';
              });
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
