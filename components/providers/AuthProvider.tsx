'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getUserOrganizations,
  getCurrentOrganizationId,
  onAuthStateChange,
  type AuthUser,
  type Organization
} from '@/lib/auth';
import { FullPageSpinner } from '@/components/ui/loading-spinner';

interface AuthContextType {
  user: AuthUser | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  setCurrentOrganization: (org: Organization) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const refreshOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganizationState(null);
      return;
    }

    try {
      const userOrgs = await getUserOrganizations(user.id);
      setOrganizations(userOrgs);

      // Set current organization
      const currentOrgId = getCurrentOrganizationId();
      let currentOrg = null;

      if (currentOrgId) {
        currentOrg = userOrgs.find(org => org.id === currentOrgId) || null;
      }

      // If no current org or invalid org, use the first one
      if (!currentOrg && userOrgs.length > 0) {
        currentOrg = userOrgs[0];
        localStorage.setItem('currentOrganization', currentOrg.id);
      }

      setCurrentOrganizationState(currentOrg);

      // If user has no organizations and we're not already on onboarding, redirect
      if (userOrgs.length === 0 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/onboarding' && currentPath !== '/login' && currentPath !== '/') {
          console.log('User has no organizations, redirecting to onboarding');
          router.push('/onboarding');
        }
      }
    } catch (error) {
      console.error('Error refreshing organizations:', error);
      setOrganizations([]);
      setCurrentOrganizationState(null);
    }
  };

  const setCurrentOrganization = (org: Organization) => {
    setCurrentOrganizationState(org);
    localStorage.setItem('currentOrganization', org.id);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 AuthProvider: Initializing auth...');
      setLoading(true);

      try {
        const currentUser = await getCurrentUser();
        console.log('📝 AuthProvider: Current user:', {
          hasUser: !!currentUser,
          email: currentUser?.email
        });
        setUser(currentUser);
        if (currentUser) {
          await refreshOrganizations();
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error initializing auth:', error);
      } finally {
        setLoading(false);
        console.log('✅ AuthProvider: Initialization complete');
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      console.log('🔄 AuthProvider: Auth state changed:', {
        hasUser: !!authUser,
        email: authUser?.email
      });
      setUser(authUser);

      if (authUser) {
        await refreshOrganizations();
      } else {
        console.log('🚪 AuthProvider: No user, clearing data and redirecting to login');
        setOrganizations([]);
        setCurrentOrganizationState(null);
        localStorage.removeItem('currentOrganization');
        router.push('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Refresh organizations when user changes
  useEffect(() => {
    if (user && !loading) {
      refreshOrganizations();
    }
  }, [user, loading]);

  const value: AuthContextType = {
    user,
    organizations,
    currentOrganization,
    loading,
    refreshUser,
    refreshOrganizations,
    setCurrentOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { redirectTo?: string; requireOrganization?: boolean } = {}
) {
  const { redirectTo = '/login', requireOrganization = false } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, currentOrganization, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(redirectTo);
        } else if (requireOrganization && !currentOrganization) {
          router.push('/onboarding');
        }
      }
    }, [user, currentOrganization, loading, router]);

    if (loading) {
      return <FullPageSpinner text="Authenticating..." />;
    }

    if (!user || (requireOrganization && !currentOrganization)) {
      return null;
    }

    return <Component {...props} />;
  };
}
