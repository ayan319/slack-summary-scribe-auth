/**
 * Referral System for Product-Led Growth
 * Handles referral tracking, rewards, and team invitations
 */

export interface ReferralData {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referredEmail: string;
  code: string;
  status: 'pending' | 'completed' | 'expired';
  rewardType: 'free_month' | 'credits' | 'discount';
  rewardValue: number;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

export interface ReferralReward {
  type: 'free_month' | 'credits' | 'discount';
  value: number;
  description: string;
  icon: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: string;
    name: string;
    referrals: number;
    rewards: number;
  }>;
}

export class ReferralSystem {
  private static readonly REFERRAL_REWARDS: Record<string, ReferralReward> = {
    free_month: {
      type: 'free_month',
      value: 1,
      description: '1 month free Pro plan',
      icon: '🎁'
    },
    credits: {
      type: 'credits',
      value: 100,
      description: '100 summary credits',
      icon: '⚡'
    },
    discount: {
      type: 'discount',
      value: 25,
      description: '25% off next month',
      icon: '💰'
    }
  };

  /**
   * Generate a unique referral code
   */
  static generateReferralCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const userHash = userId.slice(-4);
    const random = Math.random().toString(36).substring(2, 6);
    return `${userHash}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Create a referral invitation
   */
  static async createReferral(data: {
    referrerId: string;
    referredEmail: string;
    rewardType?: 'free_month' | 'credits' | 'discount';
  }): Promise<{ data: ReferralData | null; error: string | null }> {
    try {
      const code = this.generateReferralCode(data.referrerId);
      const rewardType = data.rewardType || 'free_month';
      const reward = this.REFERRAL_REWARDS[rewardType];

      const referral: ReferralData = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        referrerId: data.referrerId,
        referredEmail: data.referredEmail,
        code,
        status: 'pending',
        rewardType: reward.type,
        rewardValue: reward.value,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      // Store in database
      await this.storeReferral(referral);

      // Send invitation email
      await this.sendReferralInvitation(referral);

      return { data: referral, error: null };
    } catch (error) {
      console.error('Create referral error:', error);
      return { data: null, error: 'Failed to create referral' };
    }
  }

  /**
   * Process referral completion when referred user signs up
   */
  static async completeReferral(data: {
    code: string;
    referredUserId: string;
  }): Promise<{ success: boolean; reward?: ReferralReward }> {
    try {
      // Find pending referral by code
      const referral = await this.getReferralByCode(data.code);
      
      if (!referral) {
        return { success: false };
      }

      if (referral.status !== 'pending') {
        return { success: false };
      }

      if (new Date(referral.expiresAt) < new Date()) {
        await this.updateReferralStatus(referral.id, 'expired');
        return { success: false };
      }

      // Update referral as completed
      await this.updateReferral(referral.id, {
        referredUserId: data.referredUserId,
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Apply reward to referrer
      const reward = this.REFERRAL_REWARDS[referral.rewardType];
      await this.applyReward(referral.referrerId, reward);

      // Send reward notification
      await this.sendRewardNotification(referral);

      // Track analytics
      this.trackReferralCompletion(referral);

      return { success: true, reward };
    } catch (error) {
      console.error('Complete referral error:', error);
      return { success: false };
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getUserReferralStats(userId: string): Promise<{
    referrals: ReferralData[];
    stats: {
      total: number;
      completed: number;
      pending: number;
      totalRewards: number;
    };
  }> {
    try {
      // Get user's referrals
      const referrals = await this.getUserReferrals(userId);
      
      const stats = {
        total: referrals.length,
        completed: referrals.filter(r => r.status === 'completed').length,
        pending: referrals.filter(r => r.status === 'pending').length,
        totalRewards: referrals
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.rewardValue, 0)
      };

      return { referrals, stats };
    } catch (error) {
      console.error('Get referral stats error:', error);
      return {
        referrals: [],
        stats: { total: 0, completed: 0, pending: 0, totalRewards: 0 }
      };
    }
  }

  /**
   * Generate referral link
   */
  static generateReferralLink(code: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code}`;
  }

  /**
   * Validate referral code
   */
  static async validateReferralCode(code: string): Promise<{
    valid: boolean;
    referral?: ReferralData;
    reward?: ReferralReward;
  }> {
    try {
      const referral = await this.getReferralByCode(code);
      
      if (!referral) {
        return { valid: false };
      }

      if (referral.status !== 'pending') {
        return { valid: false };
      }

      if (new Date(referral.expiresAt) < new Date()) {
        await this.updateReferralStatus(referral.id, 'expired');
        return { valid: false };
      }

      const reward = this.REFERRAL_REWARDS[referral.rewardType];
      return { valid: true, referral, reward };
    } catch (error) {
      console.error('Validate referral code error:', error);
      return { valid: false };
    }
  }

  /**
   * Get system-wide referral statistics
   */
  static async getSystemReferralStats(): Promise<ReferralStats> {
    try {
      // Mock data - replace with real database queries
      return {
        totalReferrals: 1247,
        completedReferrals: 892,
        pendingReferrals: 234,
        totalRewards: 2156,
        conversionRate: 71.5,
        topReferrers: [
          { userId: 'user1', name: 'John Doe', referrals: 45, rewards: 67 },
          { userId: 'user2', name: 'Jane Smith', referrals: 38, rewards: 52 },
          { userId: 'user3', name: 'Bob Johnson', referrals: 32, rewards: 41 }
        ]
      };
    } catch (error) {
      console.error('Get system referral stats error:', error);
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalRewards: 0,
        conversionRate: 0,
        topReferrers: []
      };
    }
  }

  // Private helper methods

  private static async storeReferral(referral: ReferralData): Promise<void> {
    // Store in database
    console.log('Storing referral:', referral);
    // await SummaryDatabase.storeReferral(referral);
  }

  private static async getReferralByCode(code: string): Promise<ReferralData | null> {
    // Get from database
    console.log('Getting referral by code:', code);
    // return await SummaryDatabase.getReferralByCode(code);
    return null; // Mock for now
  }

  private static async getUserReferrals(userId: string): Promise<ReferralData[]> {
    // Get from database
    console.log('Getting user referrals:', userId);
    // return await SummaryDatabase.getUserReferrals(userId);
    return []; // Mock for now
  }

  private static async updateReferral(id: string, updates: Partial<ReferralData>): Promise<void> {
    // Update in database
    console.log('Updating referral:', id, updates);
    // await SummaryDatabase.updateReferral(id, updates);
  }

  private static async updateReferralStatus(id: string, status: ReferralData['status']): Promise<void> {
    await this.updateReferral(id, { status });
  }

  private static async applyReward(userId: string, reward: ReferralReward): Promise<void> {
    // Apply reward to user account
    console.log('Applying reward:', userId, reward);
    
    switch (reward.type) {
      case 'free_month':
        // Extend subscription by one month
        break;
      case 'credits':
        // Add credits to user account
        break;
      case 'discount':
        // Apply discount to next billing cycle
        break;
    }
  }

  private static async sendReferralInvitation(referral: ReferralData): Promise<void> {
    // Send invitation email
    console.log('Sending referral invitation:', referral);
    
    // Use email service
    // await EmailNotificationService.sendTeamInvitation({
    //   to: referral.referredEmail,
    //   inviterName: 'User Name',
    //   teamName: 'SummaryAI',
    //   inviteLink: this.generateReferralLink(referral.code)
    // });
  }

  private static async sendRewardNotification(referral: ReferralData): Promise<void> {
    // Send reward notification
    console.log('Sending reward notification:', referral);
    
    // Use email service
    // await EmailNotificationService.sendReferralReward({
    //   to: referrer.email,
    //   userName: referrer.name,
    //   referredUserName: referred.name,
    //   rewardType: reward.description,
    //   rewardValue: reward.icon + ' ' + reward.description
    // });
  }

  private static trackReferralCompletion(referral: ReferralData): void {
    // Track analytics
    console.log('Tracking referral completion:', referral);
    
    // Use analytics service
    // Analytics.track('Referral Completed', {
    //   referralId: referral.id,
    //   referrerId: referral.referrerId,
    //   referredUserId: referral.referredUserId,
    //   rewardType: referral.rewardType,
    //   rewardValue: referral.rewardValue
    // });
  }
}

// Team invitation system
export class TeamInviteSystem {
  /**
   * Send team invitation to workspace members
   */
  static async inviteTeamMembers(data: {
    inviterId: string;
    teamId: string;
    emails: string[];
    role?: 'member' | 'admin';
  }): Promise<{ success: boolean; invitations: any[] }> {
    try {
      const invitations = [];

      for (const email of data.emails) {
        const invitation = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          inviterId: data.inviterId,
          teamId: data.teamId,
          email,
          role: data.role || 'member',
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        // Store invitation
        await this.storeInvitation(invitation);

        // Send invitation email
        await this.sendTeamInvitation(invitation);

        invitations.push(invitation);
      }

      return { success: true, invitations };
    } catch (error) {
      console.error('Team invite error:', error);
      return { success: false, invitations: [] };
    }
  }

  private static async storeInvitation(invitation: any): Promise<void> {
    console.log('Storing team invitation:', invitation);
    // await SummaryDatabase.storeTeamInvitation(invitation);
  }

  private static async sendTeamInvitation(invitation: any): Promise<void> {
    console.log('Sending team invitation:', invitation);
    // await EmailNotificationService.sendTeamInvitation({...});
  }
}
