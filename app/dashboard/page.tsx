"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("🔍 Dashboard: Initializing and checking session...");
    const supabase = createBrowserSupabaseClient();
    
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Dashboard: Session error:", error);
          setError(error.message);
          return;
        }
        
        console.log("📝 Dashboard: Session data:", {
          hasSession: !!data.session,
          user: data.session?.user?.email
        });
        
        setSession(data.session);
      } catch (err) {
        console.error("❌ Dashboard: Exception getting session:", err);
        setError("Failed to retrieve session");
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">✅ Dashboard</h1>
        <Button onClick={handleLogout}>Sign Out</Button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Session Information</h2>
        <div className="bg-gray-50 p-4 rounded-md overflow-auto">
          <pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {session.user.id}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Provider:</strong> {session.user.app_metadata?.provider || 'email'}</p>
          <p><strong>Created At:</strong> {new Date(session.user.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
