/**
 * Growth Analytics & Experiment Tracking
 * Comprehensive analytics for viral growth, referrals, and user engagement
 */

import { createClient } from '@supabase/supabase-js';
import PostHogClient from './posthog.client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GrowthMetrics {
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  referralConversions: number;
  viralCoefficient: number;
  retentionRate: number;
  churnRate: number;
  averageSessionDuration: number;
  summariesGenerated: number;
  slackIntegrations: number;
}

export interface FunnelMetrics {
  landingPageViews: number;
  signupStarted: number;
  signupCompleted: number;
  onboardingCompleted: number;
  firstSummaryGenerated: number;
  slackConnected: number;
  firstReferralSent: number;
}

export interface ReferralMetrics {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  referralConversionRate: number;
  topReferrers: Array<{
    userId: string;
    email: string;
    referralCount: number;
    conversionCount: number;
  }>;
}

export class GrowthAnalytics {
  
  /**
   * Get comprehensive growth metrics for dashboard
   */
  static async getGrowthMetrics(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<GrowthMetrics> {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Total and active users
      const { data: totalUsersData } = await supabase
        .from('users')
        .select('id, created_at, last_sign_in_at');

      const totalUsers = totalUsersData?.length || 0;
      const activeUsers = totalUsersData?.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) >= startDate
      ).length || 0;

      const newSignups = totalUsersData?.filter(user => 
        new Date(user.created_at) >= startDate
      ).length || 0;

      // Referral conversions
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const referralConversions = referralData?.filter(r => r.status === 'converted').length || 0;

      // Calculate viral coefficient (referrals per user)
      const viralCoefficient = totalUsers > 0 ? (referralData?.length || 0) / totalUsers : 0;

      // Retention rate (users who returned after 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const retentionUsers = totalUsersData?.filter(user => 
        user.created_at < weekAgo.toISOString() && 
        user.last_sign_in_at && new Date(user.last_sign_in_at) >= weekAgo
      ).length || 0;

      const eligibleUsers = totalUsersData?.filter(user => 
        user.created_at < weekAgo.toISOString()
      ).length || 0;

      const retentionRate = eligibleUsers > 0 ? (retentionUsers / eligibleUsers) * 100 : 0;
      const churnRate = 100 - retentionRate;

      // Summaries generated
      const { data: summariesData } = await supabase
        .from('summaries')
        .select('id')
        .gte('created_at', startDate.toISOString());

      const summariesGenerated = summariesData?.length || 0;

      // Slack integrations
      const { data: slackData } = await supabase
        .from('slack_integrations')
        .select('id')
        .eq('is_active', true)
        .gte('created_at', startDate.toISOString());

      const slackIntegrations = slackData?.length || 0;

      return {
        totalUsers,
        activeUsers,
        newSignups,
        referralConversions,
        viralCoefficient: Math.round(viralCoefficient * 100) / 100,
        retentionRate: Math.round(retentionRate * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
        averageSessionDuration: 0, // Would need session tracking
        summariesGenerated,
        slackIntegrations
      };
    } catch (error) {
      console.error('Error fetching growth metrics:', error);
      throw error;
    }
  }

  /**
   * Get funnel conversion metrics
   */
  static async getFunnelMetrics(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<FunnelMetrics> {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Get PostHog events for funnel analysis
      const events = await PostHogClient.getEvents([
        'landing_page_view',
        'signup_started',
        'signup_completed',
        'onboarding_completed',
        'first_summary_generated',
        'slack_connected',
        'first_referral_sent'
      ], startDate);

      return {
        landingPageViews: events.landing_page_view || 0,
        signupStarted: events.signup_started || 0,
        signupCompleted: events.signup_completed || 0,
        onboardingCompleted: events.onboarding_completed || 0,
        firstSummaryGenerated: events.first_summary_generated || 0,
        slackConnected: events.slack_connected || 0,
        firstReferralSent: events.first_referral_sent || 0
      };
    } catch (error) {
      console.error('Error fetching funnel metrics:', error);
      // Return default values if PostHog is unavailable
      return {
        landingPageViews: 0,
        signupStarted: 0,
        signupCompleted: 0,
        onboardingCompleted: 0,
        firstSummaryGenerated: 0,
        slackConnected: 0,
        firstReferralSent: 0
      };
    }
  }

  /**
   * Get detailed referral metrics
   */
  static async getReferralMetrics(): Promise<ReferralMetrics> {
    try {
      const { data: referralData } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:users!referrer_id(email)
        `);

      const totalReferrals = referralData?.length || 0;
      const pendingReferrals = referralData?.filter(r => r.status === 'pending').length || 0;
      const convertedReferrals = referralData?.filter(r => r.status === 'converted').length || 0;
      const referralConversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

      // Calculate top referrers
      const referrerStats = new Map();
      referralData?.forEach(referral => {
        const referrerId = referral.referrer_id;
        const referrerEmail = referral.referrer?.email || 'Unknown';
        
        if (!referrerStats.has(referrerId)) {
          referrerStats.set(referrerId, {
            userId: referrerId,
            email: referrerEmail,
            referralCount: 0,
            conversionCount: 0
          });
        }
        
        const stats = referrerStats.get(referrerId);
        stats.referralCount++;
        if (referral.status === 'converted') {
          stats.conversionCount++;
        }
      });

      const topReferrers = Array.from(referrerStats.values())
        .sort((a, b) => b.referralCount - a.referralCount)
        .slice(0, 10);

      return {
        totalReferrals,
        pendingReferrals,
        convertedReferrals,
        referralConversionRate: Math.round(referralConversionRate * 100) / 100,
        topReferrers
      };
    } catch (error) {
      console.error('Error fetching referral metrics:', error);
      throw error;
    }
  }

  /**
   * Track growth experiment events
   */
  static trackExperiment(experimentName: string, variant: string, userId: string, properties?: any) {
    PostHogClient.track('growth_experiment', {
      experiment_name: experimentName,
      variant,
      user_id: userId,
      ...properties
    });
  }

  /**
   * Track viral sharing events
   */
  static trackViralShare(userId: string, shareType: 'referral' | 'social' | 'email', platform?: string) {
    PostHogClient.track('viral_share', {
      user_id: userId,
      share_type: shareType,
      platform,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track re-engagement campaign effectiveness
   */
  static trackReEngagement(userId: string, campaignType: string, action: 'sent' | 'opened' | 'clicked' | 'converted') {
    PostHogClient.track('re_engagement', {
      user_id: userId,
      campaign_type: campaignType,
      action,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get user cohort analysis
   */
  static async getCohortAnalysis(cohortType: 'weekly' | 'monthly' = 'weekly') {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, created_at, last_sign_in_at')
        .order('created_at');

      if (!users) return [];

      const cohorts = new Map();
      
      users.forEach(user => {
        const cohortDate = cohortType === 'weekly' 
          ? this.getWeekStart(new Date(user.created_at))
          : this.getMonthStart(new Date(user.created_at));
        
        const cohortKey = cohortDate.toISOString().split('T')[0];
        
        if (!cohorts.has(cohortKey)) {
          cohorts.set(cohortKey, {
            cohortDate: cohortKey,
            totalUsers: 0,
            activeUsers: 0,
            retentionRate: 0
          });
        }
        
        const cohort = cohorts.get(cohortKey);
        cohort.totalUsers++;
        
        // Check if user is still active (signed in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (user.last_sign_in_at && new Date(user.last_sign_in_at) >= thirtyDaysAgo) {
          cohort.activeUsers++;
        }
        
        cohort.retentionRate = (cohort.activeUsers / cohort.totalUsers) * 100;
      });

      return Array.from(cohorts.values()).sort((a, b) => 
        new Date(a.cohortDate).getTime() - new Date(b.cohortDate).getTime()
      );
    } catch (error) {
      console.error('Error generating cohort analysis:', error);
      throw error;
    }
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private static getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}

export default GrowthAnalytics;
