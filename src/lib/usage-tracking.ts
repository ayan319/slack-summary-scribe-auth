/**
 * Usage Tracking Engine
 * Comprehensive user engagement and usage analytics system
 */

export interface UsageEvent {
  id: string;
  userId: string;
  teamId?: string;
  eventType: 'summary_created' | 'export_used' | 'personalization_changed' | 'team_invite_sent' | 'login' | 'feature_used';
  eventData: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  planType: 'free' | 'pro' | 'enterprise';
  metadata?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    duration?: number;
  };
}

export interface DailyUsageStats {
  userId: string;
  date: string;
  summariesCreated: number;
  exportsUsed: number;
  timeSpentMinutes: number;
  featuresUsed: string[];
  sessionCount: number;
  planType: string;
  teamInvitesSent: number;
  personalizationChanges: number;
}

export interface WeeklyUsageStats {
  userId: string;
  weekStart: string;
  weekEnd: string;
  totalSummaries: number;
  totalExports: number;
  totalTimeMinutes: number;
  uniqueFeaturesUsed: number;
  totalSessions: number;
  averageSessionMinutes: number;
  planType: string;
  engagementScore: number;
  churnRisk: 'low' | 'medium' | 'high';
}

export interface UserEngagementProfile {
  userId: string;
  planType: string;
  signupDate: string;
  lastActiveDate: string;
  totalSummaries: number;
  totalExports: number;
  totalTimeSpent: number;
  averageWeeklyUsage: number;
  preferredFeatures: string[];
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  churnRisk: number; // 0-1 score
  lifetimeValue: number;
  teamRole: 'owner' | 'admin' | 'member';
  referralCount: number;
}

export class UsageTrackingEngine {
  private static sessionId: string = '';
  private static sessionStartTime: number = 0;

  /**
   * Initialize tracking session
   */
  static initializeSession(userId: string): string {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.sessionStartTime = Date.now();
    
    // Track session start
    this.trackEvent({
      userId,
      eventType: 'login',
      eventData: {
        sessionStart: true,
        timestamp: new Date().toISOString()
      }
    });

    return this.sessionId;
  }

  /**
   * Track user event
   */
  static async trackEvent(event: Omit<UsageEvent, 'id' | 'timestamp' | 'sessionId' | 'planType'>): Promise<void> {
    try {
      const userPlan = await this.getUserPlan(event.userId);
      
      const usageEvent: UsageEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        ...event,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId || 'unknown',
        planType: userPlan
      };

      // Store in database
      await this.storeEvent(usageEvent);

      // Send to analytics
      await this.sendToAnalytics(usageEvent);

      // Update daily stats
      await this.updateDailyStats(usageEvent);

      // Check for engagement triggers
      await this.checkEngagementTriggers(usageEvent);

    } catch (error) {
      console.error('Usage tracking error:', error);
    }
  }

  /**
   * Track summary creation
   */
  static async trackSummaryCreated(data: {
    userId: string;
    summaryId: string;
    aiModel: string;
    confidence: number;
    processingTime: number;
    wordCount: number;
    personalizationUsed: boolean;
  }): Promise<void> {
    await this.trackEvent({
      userId: data.userId,
      eventType: 'summary_created',
      eventData: {
        summaryId: data.summaryId,
        aiModel: data.aiModel,
        confidence: data.confidence,
        processingTime: data.processingTime,
        wordCount: data.wordCount,
        personalizationUsed: data.personalizationUsed
      }
    });
  }

  /**
   * Track export usage
   */
  static async trackExportUsed(data: {
    userId: string;
    summaryId: string;
    exportType: 'pdf' | 'notion' | 'markdown' | 'crm';
    exportSize: number;
  }): Promise<void> {
    await this.trackEvent({
      userId: data.userId,
      eventType: 'export_used',
      eventData: {
        summaryId: data.summaryId,
        exportType: data.exportType,
        exportSize: data.exportSize
      }
    });
  }

  /**
   * Track personalization changes
   */
  static async trackPersonalizationChanged(data: {
    userId: string;
    settingType: 'style' | 'tone' | 'focus' | 'custom';
    oldValue: string;
    newValue: string;
  }): Promise<void> {
    await this.trackEvent({
      userId: data.userId,
      eventType: 'personalization_changed',
      eventData: {
        settingType: data.settingType,
        oldValue: data.oldValue,
        newValue: data.newValue
      }
    });
  }

  /**
   * Track team invite
   */
  static async trackTeamInvite(data: {
    userId: string;
    invitedEmail: string;
    teamId: string;
    role: string;
  }): Promise<void> {
    await this.trackEvent({
      userId: data.userId,
      teamId: data.teamId,
      eventType: 'team_invite_sent',
      eventData: {
        invitedEmail: data.invitedEmail,
        role: data.role
      }
    });
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsed(data: {
    userId: string;
    featureName: string;
    featureCategory: string;
    duration?: number;
    success: boolean;
  }): Promise<void> {
    await this.trackEvent({
      userId: data.userId,
      eventType: 'feature_used',
      eventData: {
        featureName: data.featureName,
        featureCategory: data.featureCategory,
        duration: data.duration,
        success: data.success
      }
    });
  }

  /**
   * Get daily usage stats
   */
  static async getDailyStats(userId: string, date: string): Promise<DailyUsageStats | null> {
    try {
      // In production, query from database
      console.log('Getting daily stats for:', userId, date);
      
      // Mock implementation
      return {
        userId,
        date,
        summariesCreated: 5,
        exportsUsed: 2,
        timeSpentMinutes: 45,
        featuresUsed: ['personalization', 'export', 'team_invite'],
        sessionCount: 3,
        planType: 'pro',
        teamInvitesSent: 1,
        personalizationChanges: 2
      };
    } catch (error) {
      console.error('Error getting daily stats:', error);
      return null;
    }
  }

  /**
   * Get weekly usage stats
   */
  static async getWeeklyStats(userId: string, weekStart: string): Promise<WeeklyUsageStats | null> {
    try {
      // In production, aggregate from daily stats
      console.log('Getting weekly stats for:', userId, weekStart);
      
      // Mock implementation
      return {
        userId,
        weekStart,
        weekEnd: new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalSummaries: 25,
        totalExports: 8,
        totalTimeMinutes: 180,
        uniqueFeaturesUsed: 6,
        totalSessions: 12,
        averageSessionMinutes: 15,
        planType: 'pro',
        engagementScore: 0.85,
        churnRisk: 'low'
      };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return null;
    }
  }

  /**
   * Get user engagement profile
   */
  static async getUserEngagementProfile(userId: string): Promise<UserEngagementProfile | null> {
    try {
      // In production, aggregate from all user data
      console.log('Getting engagement profile for:', userId);
      
      // Mock implementation
      return {
        userId,
        planType: 'pro',
        signupDate: '2024-06-01',
        lastActiveDate: new Date().toISOString().split('T')[0],
        totalSummaries: 150,
        totalExports: 45,
        totalTimeSpent: 1200,
        averageWeeklyUsage: 25,
        preferredFeatures: ['personalization', 'export', 'team_collaboration'],
        engagementTrend: 'increasing',
        churnRisk: 0.15,
        lifetimeValue: 348,
        teamRole: 'admin',
        referralCount: 3
      };
    } catch (error) {
      console.error('Error getting engagement profile:', error);
      return null;
    }
  }

  /**
   * Calculate engagement score
   */
  static calculateEngagementScore(stats: WeeklyUsageStats): number {
    const weights = {
      summaries: 0.3,
      exports: 0.2,
      timeSpent: 0.2,
      features: 0.15,
      sessions: 0.15
    };

    // Normalize values (adjust thresholds based on your data)
    const normalizedSummaries = Math.min(stats.totalSummaries / 20, 1);
    const normalizedExports = Math.min(stats.totalExports / 10, 1);
    const normalizedTime = Math.min(stats.totalTimeMinutes / 120, 1);
    const normalizedFeatures = Math.min(stats.uniqueFeaturesUsed / 8, 1);
    const normalizedSessions = Math.min(stats.totalSessions / 15, 1);

    return (
      normalizedSummaries * weights.summaries +
      normalizedExports * weights.exports +
      normalizedTime * weights.timeSpent +
      normalizedFeatures * weights.features +
      normalizedSessions * weights.sessions
    );
  }

  /**
   * Detect usage patterns
   */
  static async detectUsagePatterns(userId: string): Promise<{
    isHeavyUser: boolean;
    isAtRisk: boolean;
    preferredTimeOfDay: string;
    preferredFeatures: string[];
    usageTrend: 'increasing' | 'stable' | 'decreasing';
  }> {
    const profile = await this.getUserEngagementProfile(userId);
    if (!profile) {
      return {
        isHeavyUser: false,
        isAtRisk: false,
        preferredTimeOfDay: 'morning',
        preferredFeatures: [],
        usageTrend: 'stable'
      };
    }

    return {
      isHeavyUser: profile.averageWeeklyUsage > 30,
      isAtRisk: profile.churnRisk > 0.7,
      preferredTimeOfDay: 'morning', // Would analyze from actual usage times
      preferredFeatures: profile.preferredFeatures,
      usageTrend: profile.engagementTrend
    };
  }

  // Private helper methods
  private static async getUserPlan(userId: string): Promise<'free' | 'pro' | 'enterprise'> {
    // In production, query user's current plan from database
    return 'pro'; // Mock
  }

  private static async storeEvent(event: UsageEvent): Promise<void> {
    // Store in Supabase
    console.log('Storing usage event:', event);
    // await supabase.from('usage_events').insert(event);
  }

  private static async sendToAnalytics(event: UsageEvent): Promise<void> {
    // Send to Mixpanel
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.eventType, {
        user_id: event.userId,
        plan_type: event.planType,
        session_id: event.sessionId,
        ...event.eventData
      });
    }
  }

  private static async updateDailyStats(event: UsageEvent): Promise<void> {
    // Update or create daily stats record
    console.log('Updating daily stats for event:', event.eventType);
  }

  private static async checkEngagementTriggers(event: UsageEvent): Promise<void> {
    // Check if this event should trigger any engagement actions
    console.log('Checking engagement triggers for:', event.eventType);
  }
}
