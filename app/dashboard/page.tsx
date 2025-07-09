'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2 } from 'lucide-react';
import ResponsivePage from './responsive-page';

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user, loading: authLoading, organizations, currentOrganization } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      console.log('🔍 Dashboard: Checking session...');

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('📝 Dashboard session data:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: error?.message
        });

        setSession(session);
        setDebugInfo({
          session: !!session,
          user: !!session?.user,
          email: session?.user?.email,
          authProviderUser: !!user,
          authProviderLoading: authLoading,
          organizationsCount: organizations.length,
          hasCurrentOrg: !!currentOrganization,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Dashboard session error:', error);
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Dashboard auth state change:', event, !!session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [user, authLoading, organizations, currentOrganization]);

  // Show loading state
  if (sessionLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard... Please wait while we fetch your session.</span>
        </div>
      </div>
    );
  }

  // Show debug info if no session
  if (!session || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-4">Dashboard Debug Information</h1>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Session Status:</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
          <div className="mt-4">
            <p className="text-red-600">
              {!session ? '❌ No Supabase session found' : ''}
              {!user ? '❌ No user from AuthProvider' : ''}
            </p>
            <a href="/login" className="text-blue-600 underline mt-2 inline-block">
              Go back to login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If we have both session and user, show the actual dashboard
  console.log('✅ Dashboard: Rendering full dashboard');
  return <ResponsivePage />;
}
