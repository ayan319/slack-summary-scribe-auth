/**
 * Feature Flags System for SummaryAI
 * Supports environment variables and Supabase-based configuration
 */

import React from 'react';
import { createClient } from '@supabase/supabase-js';

// Feature flag definitions
export interface FeatureFlags {
  // Core Features
  SLACK_INTEGRATION: boolean;
  NOTION_EXPORT: boolean;
  PDF_EXPORT: boolean;
  TEAM_COLLABORATION: boolean;
  
  // AI Features
  ADVANCED_AI_MODELS: boolean;
  CUSTOM_PROMPTS: boolean;
  SENTIMENT_ANALYSIS: boolean;
  SKILLS_DETECTION: boolean;
  
  // UI Features
  DARK_MODE: boolean;
  ONBOARDING_FLOW: boolean;
  USAGE_ANALYTICS: boolean;
  SHARE_SUMMARIES: boolean;
  
  // Billing Features
  STRIPE_BILLING: boolean;
  USAGE_LIMITS: boolean;
  PLAN_UPGRADES: boolean;
  
  // Admin Features
  ADMIN_DASHBOARD: boolean;
  USER_MANAGEMENT: boolean;
  ANALYTICS_DASHBOARD: boolean;
  
  // Experimental Features
  AI_CHAT: boolean;
  VOICE_SUMMARIES: boolean;
  REAL_TIME_COLLABORATION: boolean;
  API_ACCESS: boolean;
}

// Default feature flag values
const DEFAULT_FLAGS: FeatureFlags = {
  // Core Features
  SLACK_INTEGRATION: true,
  NOTION_EXPORT: true,
  PDF_EXPORT: true,
  TEAM_COLLABORATION: true,
  
  // AI Features
  ADVANCED_AI_MODELS: true,
  CUSTOM_PROMPTS: false,
  SENTIMENT_ANALYSIS: true,
  SKILLS_DETECTION: true,
  
  // UI Features
  DARK_MODE: true,
  ONBOARDING_FLOW: true,
  USAGE_ANALYTICS: true,
  SHARE_SUMMARIES: true,
  
  // Billing Features
  STRIPE_BILLING: true,
  USAGE_LIMITS: true,
  PLAN_UPGRADES: true,
  
  // Admin Features
  ADMIN_DASHBOARD: true,
  USER_MANAGEMENT: true,
  ANALYTICS_DASHBOARD: true,
  
  // Experimental Features
  AI_CHAT: false,
  VOICE_SUMMARIES: false,
  REAL_TIME_COLLABORATION: false,
  API_ACCESS: false,
};

// Environment-based overrides
const ENV_OVERRIDES: Partial<FeatureFlags> = {
  // Development environment
  ...(process.env.NODE_ENV === 'development' && {
    AI_CHAT: true,
    VOICE_SUMMARIES: true,
    REAL_TIME_COLLABORATION: true,
    API_ACCESS: true,
  }),
  
  // Production environment
  ...(process.env.NODE_ENV === 'production' && {
    AI_CHAT: false,
    VOICE_SUMMARIES: false,
    REAL_TIME_COLLABORATION: false,
  }),
  
  // Specific environment variable overrides
  ...(process.env.ENABLE_AI_CHAT === 'true' && { AI_CHAT: true }),
  ...(process.env.ENABLE_VOICE_SUMMARIES === 'true' && { VOICE_SUMMARIES: true }),
  ...(process.env.ENABLE_API_ACCESS === 'true' && { API_ACCESS: true }),
  ...(process.env.DISABLE_BILLING === 'true' && { 
    STRIPE_BILLING: false, 
    USAGE_LIMITS: false, 
    PLAN_UPGRADES: false 
  }),
};

class FeatureFlagManager {
  private flags: FeatureFlags;
  private supabase: any;
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.flags = { ...DEFAULT_FLAGS, ...ENV_OVERRIDES };
    
    // Initialize Supabase client if available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
  }

  /**
   * Get a feature flag value
   */
  async getFlag(flagName: keyof FeatureFlags): Promise<boolean> {
    await this.refreshFlags();
    return this.flags[flagName];
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlags> {
    await this.refreshFlags();
    return { ...this.flags };
  }

  /**
   * Check if a feature is enabled
   */
  async isEnabled(flagName: keyof FeatureFlags): Promise<boolean> {
    return this.getFlag(flagName);
  }

  /**
   * Get flags for a specific user (with user-specific overrides)
   */
  async getFlagsForUser(userId: string, userPlan?: string): Promise<FeatureFlags> {
    await this.refreshFlags();
    
    const userFlags = { ...this.flags };
    
    // Plan-based feature access
    if (userPlan) {
      switch (userPlan) {
        case 'free':
          userFlags.ADVANCED_AI_MODELS = false;
          userFlags.CUSTOM_PROMPTS = false;
          userFlags.API_ACCESS = false;
          userFlags.ANALYTICS_DASHBOARD = false;
          break;
        case 'pro':
          userFlags.ADVANCED_AI_MODELS = true;
          userFlags.CUSTOM_PROMPTS = true;
          userFlags.API_ACCESS = false;
          break;
        case 'enterprise':
          userFlags.ADVANCED_AI_MODELS = true;
          userFlags.CUSTOM_PROMPTS = true;
          userFlags.API_ACCESS = true;
          userFlags.ANALYTICS_DASHBOARD = true;
          break;
      }
    }

    // Load user-specific overrides from database
    if (this.supabase) {
      try {
        const { data: userOverrides } = await this.supabase
          .from('user_feature_flags')
          .select('flag_name, enabled')
          .eq('user_id', userId);

        if (userOverrides) {
          userOverrides.forEach((override: any) => {
            if (override.flag_name in userFlags) {
              userFlags[override.flag_name as keyof FeatureFlags] = override.enabled;
            }
          });
        }
      } catch (error) {
        console.warn('Failed to load user feature flags:', error);
      }
    }

    return userFlags;
  }

  /**
   * Update a feature flag (admin only)
   */
  async updateFlag(flagName: keyof FeatureFlags, enabled: boolean, adminUserId?: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Cannot update flags: Supabase not configured');
      return false;
    }

    try {
      // Update in database
      const { error } = await this.supabase
        .from('feature_flags')
        .upsert({
          flag_name: flagName,
          enabled,
          updated_by: adminUserId,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Update local cache
      this.flags[flagName] = enabled;
      
      console.log(`Feature flag ${flagName} updated to ${enabled} by ${adminUserId}`);
      return true;
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      return false;
    }
  }

  /**
   * Refresh flags from database
   */
  private async refreshFlags(): Promise<void> {
    const now = Date.now();
    
    // Skip if recently fetched
    if (now - this.lastFetch < this.cacheDuration) {
      return;
    }

    if (!this.supabase) {
      return;
    }

    try {
      const { data: dbFlags } = await this.supabase
        .from('feature_flags')
        .select('flag_name, enabled');

      if (dbFlags) {
        // Apply database overrides
        dbFlags.forEach((flag: any) => {
          if (flag.flag_name in this.flags) {
            this.flags[flag.flag_name as keyof FeatureFlags] = flag.enabled;
          }
        });
      }

      this.lastFetch = now;
    } catch (error) {
      console.warn('Failed to refresh feature flags from database:', error);
    }
  }

  /**
   * Get feature flag statistics
   */
  async getStats(): Promise<{
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    experimentalFlags: number;
  }> {
    await this.refreshFlags();
    
    const flags = Object.entries(this.flags);
    const enabled = flags.filter(([_, value]) => value).length;
    const experimental = flags.filter(([key, _]) => 
      ['AI_CHAT', 'VOICE_SUMMARIES', 'REAL_TIME_COLLABORATION', 'API_ACCESS'].includes(key)
    ).length;

    return {
      totalFlags: flags.length,
      enabledFlags: enabled,
      disabledFlags: flags.length - enabled,
      experimentalFlags: experimental,
    };
  }
}

// Global instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
export function useFeatureFlag(flagName: keyof FeatureFlags) {
  const [enabled, setEnabled] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    featureFlags.getFlag(flagName).then(value => {
      setEnabled(value);
      setLoading(false);
    });
  }, [flagName]);

  return { enabled, loading };
}

// React hook for all feature flags
export function useFeatureFlags(userId?: string, userPlan?: string) {
  const [flags, setFlags] = React.useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const loadFlags = async () => {
      try {
        const allFlags = userId 
          ? await featureFlags.getFlagsForUser(userId, userPlan)
          : await featureFlags.getAllFlags();
        setFlags(allFlags);
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
  }, [userId, userPlan]);

  return { flags, loading };
}

// Utility function for conditional rendering
export function FeatureGate({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: keyof FeatureFlags; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) {
    return fallback;
  }

  return enabled ? children : fallback;
}

// Export defaults
export { DEFAULT_FLAGS };
