/**
 * In-App Notifications System
 * Handles user notifications for stats, activity, usage, and rewards
 */

export interface Notification {
  id: string;
  userId: string;
  type: 'weekly_stats' | 'team_activity' | 'plan_usage' | 'referral_reward' | 'feature_update' | 'achievement';
  title: string;
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  category: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  weeklyStats: boolean;
  teamActivity: boolean;
  planUsage: boolean;
  referralRewards: boolean;
  featureUpdates: boolean;
  achievements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export class NotificationEngine {
  private static readonly NOTIFICATION_TEMPLATES = {
    weekly_stats: {
      icon: '📊',
      category: 'info' as const,
      priority: 'medium' as const,
      title: 'Your weekly summary is ready!',
      getMessage: (data: any) => 
        `You created ${data.summaries} summaries this week and saved ${data.timeSaved} hours. Keep it up!`
    },
    team_activity: {
      icon: '👥',
      category: 'info' as const,
      priority: 'medium' as const,
      title: 'Team activity update',
      getMessage: (data: any) => 
        `${data.memberName} ${data.action} ${data.details}`
    },
    plan_usage: {
      icon: '⚡',
      category: 'warning' as const,
      priority: 'high' as const,
      title: 'Usage update',
      getMessage: (data: any) => 
        `You've used ${data.percentage}% of your ${data.planType} plan this month.`
    },
    referral_reward: {
      icon: '🎉',
      category: 'success' as const,
      priority: 'high' as const,
      title: 'Referral reward earned!',
      getMessage: (data: any) => 
        `${data.referredName} joined using your link. You earned ${data.reward}!`
    },
    feature_update: {
      icon: '✨',
      category: 'info' as const,
      priority: 'medium' as const,
      title: 'New feature available',
      getMessage: (data: any) => 
        `${data.featureName}: ${data.description}`
    },
    achievement: {
      icon: '🏆',
      category: 'success' as const,
      priority: 'medium' as const,
      title: 'Achievement unlocked!',
      getMessage: (data: any) => 
        `${data.achievementName}: ${data.description}`
    }
  };

  /**
   * Create notification
   */
  static async createNotification(data: {
    userId: string;
    type: Notification['type'];
    data?: Record<string, any>;
    actionUrl?: string;
    actionText?: string;
    expiresIn?: number; // hours
  }): Promise<Notification> {
    const template = this.NOTIFICATION_TEMPLATES[data.type];
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: data.userId,
      type: data.type,
      title: template.title,
      message: template.getMessage(data.data || {}),
      icon: template.icon,
      priority: template.priority,
      category: template.category,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      data: data.data,
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresIn 
        ? new Date(Date.now() + data.expiresIn * 60 * 60 * 1000).toISOString()
        : undefined
    };

    await this.storeNotification(notification);
    await this.sendRealTimeNotification(notification);
    
    return notification;
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string, 
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      type?: Notification['type'];
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      // In production, query from database with filters
      console.log('Getting notifications for user:', userId, options);
      
      // Mock data
      const mockNotifications: Notification[] = [
        {
          id: 'notif_1',
          userId,
          type: 'weekly_stats',
          title: 'Your weekly summary is ready!',
          message: 'You created 12 summaries this week and saved 4.5 hours. Keep it up!',
          icon: '📊',
          priority: 'medium',
          category: 'info',
          actionUrl: '/dashboard',
          actionText: 'View Dashboard',
          data: { summaries: 12, timeSaved: 4.5 },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif_2',
          userId,
          type: 'referral_reward',
          title: 'Referral reward earned!',
          message: 'Sarah Johnson joined using your link. You earned 1 month free!',
          icon: '🎉',
          priority: 'high',
          category: 'success',
          actionUrl: '/referrals',
          actionText: 'View Referrals',
          data: { referredName: 'Sarah Johnson', reward: '1 month free' },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif_3',
          userId,
          type: 'plan_usage',
          title: 'Usage update',
          message: 'You\'ve used 85% of your Pro plan this month.',
          icon: '⚡',
          priority: 'high',
          category: 'warning',
          data: { percentage: 85, planType: 'Pro' },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return {
        notifications: mockNotifications.slice(0, options.limit || 10),
        total: mockNotifications.length
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.updateNotification(notificationId, {
        readAt: new Date().toISOString()
      });

      // Track analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'notification_read', {
          notification_id: notificationId,
          user_id: userId
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Dismiss notification
   */
  static async dismissNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await this.updateNotification(notificationId, {
        dismissedAt: new Date().toISOString()
      });

      // Track analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'notification_dismissed', {
          notification_id: notificationId,
          user_id: userId
        });
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { notifications } = await this.getUserNotifications(userId, { unreadOnly: true });
      return notifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Create weekly stats notification
   */
  static async createWeeklyStatsNotification(userId: string, stats: {
    summaries: number;
    timeSaved: number;
    topFeatures: string[];
    weekStart: string;
    weekEnd: string;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'weekly_stats',
      data: stats,
      actionUrl: '/dashboard',
      actionText: 'View Dashboard',
      expiresIn: 168 // 7 days
    });
  }

  /**
   * Create team activity notification
   */
  static async createTeamActivityNotification(userId: string, activity: {
    memberName: string;
    action: string;
    details: string;
    teamId: string;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'team_activity',
      data: activity,
      actionUrl: `/teams/${activity.teamId}`,
      actionText: 'View Team',
      expiresIn: 72 // 3 days
    });
  }

  /**
   * Create plan usage notification
   */
  static async createPlanUsageNotification(userId: string, usage: {
    percentage: number;
    planType: string;
    feature: string;
    limit: number;
    current: number;
  }): Promise<void> {
    const actionUrl = usage.percentage >= 100 ? '/pricing' : '/dashboard';
    const actionText = usage.percentage >= 100 ? 'Upgrade Plan' : 'View Usage';

    await this.createNotification({
      userId,
      type: 'plan_usage',
      data: usage,
      actionUrl,
      actionText,
      expiresIn: 24 // 1 day
    });
  }

  /**
   * Create referral reward notification
   */
  static async createReferralRewardNotification(userId: string, reward: {
    referredName: string;
    reward: string;
    rewardValue: number;
    referralId: string;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'referral_reward',
      data: reward,
      actionUrl: '/referrals',
      actionText: 'View Referrals',
      expiresIn: 168 // 7 days
    });
  }

  /**
   * Create achievement notification
   */
  static async createAchievementNotification(userId: string, achievement: {
    achievementName: string;
    description: string;
    badge: string;
    points: number;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement',
      data: achievement,
      actionUrl: '/profile',
      actionText: 'View Profile',
      expiresIn: 168 // 7 days
    });
  }

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // In production, query from database
      console.log('Getting notification preferences for:', userId);
      
      // Mock default preferences
      return {
        userId,
        weeklyStats: true,
        teamActivity: true,
        planUsage: true,
        referralRewards: true,
        featureUpdates: true,
        achievements: true,
        emailNotifications: true,
        pushNotifications: false,
        frequency: 'immediate'
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        userId,
        weeklyStats: true,
        teamActivity: true,
        planUsage: true,
        referralRewards: true,
        featureUpdates: true,
        achievements: true,
        emailNotifications: true,
        pushNotifications: false,
        frequency: 'immediate'
      };
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      // In production, update in database
      console.log('Updating notification preferences:', userId, preferences);
      
      // Track analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'notification_preferences_updated', {
          user_id: userId,
          changes: Object.keys(preferences)
        });
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  // Private helper methods
  private static async storeNotification(notification: Notification): Promise<void> {
    // Store in Supabase
    console.log('Storing notification:', notification);
    // await supabase.from('notifications').insert(notification);
  }

  private static async updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
    // Update in Supabase
    console.log('Updating notification:', id, updates);
    // await supabase.from('notifications').update(updates).eq('id', id);
  }

  private static async sendRealTimeNotification(notification: Notification): Promise<void> {
    // Send real-time notification via WebSocket or Server-Sent Events
    console.log('Sending real-time notification:', notification);
    
    // In production, use Supabase real-time or custom WebSocket
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('new-notification', {
        detail: notification
      }));
    }
  }
}
