'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { UserProvider } from '@/lib/user-context';
import AuthRedirect from '@/components/AuthRedirect';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionContextProvider supabaseClient={supabase as any}>
      <UserProvider>
        <AuthRedirect />
        {children}
        <Toaster />
      </UserProvider>
    </SessionContextProvider>
  );
}
