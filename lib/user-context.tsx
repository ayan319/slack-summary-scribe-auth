'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getCurrentUser, AuthUser } from './auth';

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

  const refreshUser = async () => {
    try {
      setIsLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('User fetch timeout')), 8000)
      );

      const userPromise = getCurrentUser();
      const currentUser = await Promise.race([userPromise, timeoutPromise]);
      setUser(currentUser as AuthUser);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing user:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);

    // Initial user load
    refreshUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('✅ User signed in, refreshing user data');
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setIsLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('🔄 Initial session found, refreshing user data');
          await refreshUser();
        } else {
          console.log('❌ No initial session found');
          setIsLoading(false);
        }
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated, refreshing user data');
        await refreshUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: UserContextType = {
    user,
    isLoading: isLoading || !mounted,
    isAuthenticated: !!user && mounted,
    refreshUser,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <UserContext.Provider value={{ user: null, isLoading: true, isAuthenticated: false, refreshUser }}>
        {children}
      </UserContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Backward compatibility hook that matches Supabase's useUser interface
export function useAuthUser(): AuthUser | null {
  const { user } = useUser();
  return user;
}
