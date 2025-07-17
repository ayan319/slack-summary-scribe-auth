'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// Production-ready AuthUser interface
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider?: string;
}

interface UserContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Production-optimized user creation from Supabase user
  const createAuthUser = useCallback((supabaseUser: User): AuthUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name ||
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.display_name ||
            supabaseUser.email!.split('@')[0],
      avatar_url: supabaseUser.user_metadata?.avatar_url ||
                  supabaseUser.user_metadata?.picture ||
                  supabaseUser.user_metadata?.photo,
      provider: supabaseUser.app_metadata?.provider || 'email'
    };
  }, []);

  // Ultra-fast, reliable user refresh with error boundaries
  const refreshUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Session error:', error);
        }
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const authUser = createAuthUser(session.user);
      setUser(authUser);
      setIsLoading(false);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User authenticated:', authUser.email);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', error);
      }
      setUser(null);
      setIsLoading(false);
    }
  }, [createAuthUser]);

  // Production-ready initialization and auth listener
  useEffect(() => {
    if (mounted) return;

    setMounted(true);

    // Initial auth check
    refreshUser();

    // Streamlined auth state listener for production reliability
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auth event:', event);
        }

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              const authUser = createAuthUser(session.user);
              setUser(authUser);
              setIsLoading(false);
            } else {
              setUser(null);
              setIsLoading(false);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setIsLoading(false);
            break;

          case 'INITIAL_SESSION':
            // Handle initial session load
            if (session?.user) {
              const authUser = createAuthUser(session.user);
              setUser(authUser);
            } else {
              setUser(null);
            }
            setIsLoading(false);
            break;

          default:
            // Ensure loading is always resolved
            setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [mounted, refreshUser, createAuthUser]);

  // Production-grade timeout protection (2 seconds max)
  useEffect(() => {
    if (!mounted) return;

    const timeout = setTimeout(() => {
      if (isLoading) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Auth timeout reached - resolving loading state');
        }
        setIsLoading(false);
      }
    }, 2000); // 2 second maximum for production

    return () => clearTimeout(timeout);
  }, [isLoading, mounted]);

  // Production-ready context value with proper state management
  const value: UserContextType = {
    user,
    isLoading: !mounted || isLoading,
    isAuthenticated: !!user && mounted,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Production-ready hook with error boundary
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider. Ensure your component is wrapped with UserProvider.');
  }
  return context;
}

// Backward compatibility hook that matches Supabase's useUser interface
export function useAuthUser(): AuthUser | null {
  const { user } = useUser();
  return user;
}
