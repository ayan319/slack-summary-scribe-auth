import { trackFeatureUsage } from './analytics';
import { sendEmail } from './resend';
import { slackNotifications } from './slack-notifications';

// Viral growth configuration
export const VIRAL_GROWTH_CONFIG = {
  referralRewards: {
    referrer: {
      freeMonths: 1,
      credits: 100
    },
    referee: {
      freeMonths: 0.5,
      credits: 50
    }
  },
  invitationLimits: {
    free: 5,
    pro: 25,
    enterprise: 100
  },
  sharingBranding: {
    enabled: true,
    message: 'Powered by Slack Summary Scribe',
    url: process.env.NEXT_PUBLIC_SITE_URL
  }
};

// Referral data interfaces
export interface ReferralCode {
  id: string;
  code: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  active: boolean;
  metadata?: Record<string, any>;
}

export interface ReferralConversion {
  id: string;
  referralCodeId: string;
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
  conversionDate: Date;
  rewardsClaimed: boolean;
  metadata?: Record<string, any>;
}

export interface TeamInvitation {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviterName: string;
  inviteeEmail: string;
  workspaceId?: string;
  workspaceName?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  personalMessage?: string;
}

export interface ViralShare {
  id: string;
  userId: string;
  summaryId: string;
  shareType: 'public_link' | 'email' | 'slack' | 'social';
  recipientEmail?: string;
  shareUrl: string;
  viewCount: number;
  conversionCount: number;
  createdAt: Date;
  expiresAt?: Date;
  branded: boolean;
}

// Generate unique referral code
export function generateReferralCode(userId: string, userName: string): string {
  const cleanName = userName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanName}${randomSuffix}`.substring(0, 12).toUpperCase();
}

// Create referral code for user
export async function createReferralCode(
  userId: string,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; code?: ReferralCode; error?: string }> {
  try {
    const code = generateReferralCode(userId, userName);
    
    const referralCode: ReferralCode = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      code,
      userId,
      userEmail,
      userName,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      maxUses: 100,
      currentUses: 0,
      active: true
    };

    // In a real implementation, save to database
    console.log('Referral code created:', referralCode);

    // Track the creation
    await trackFeatureUsage(userId, 'referral_code_created', { code });

    return { success: true, code: referralCode };
  } catch (error) {
    console.error('Error creating referral code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send team invitation
export async function sendTeamInvitation(
  invitation: Omit<TeamInvitation, 'id' | 'sentAt' | 'expiresAt' | 'status'>
): Promise<{ success: boolean; invitation?: TeamInvitation; error?: string }> {
  try {
    const fullInvitation: TeamInvitation = {
      ...invitation,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${fullInvitation.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">You're invited to join our team! 🎉</h1>
          <p style="color: #6b7280; font-size: 16px;">Start creating AI-powered summaries together</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">Hi there! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${invitation.inviterName}</strong> (${invitation.inviterEmail}) has invited you to join their team on Slack Summary Scribe.
          </p>
          ${invitation.workspaceName ? `
            <p style="color: #4b5563; line-height: 1.6;">
              <strong>Workspace:</strong> ${invitation.workspaceName}
            </p>
          ` : ''}
          ${invitation.personalMessage ? `
            <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #2563eb;">
              <p style="color: #4b5563; margin: 0; font-style: italic;">"${invitation.personalMessage}"</p>
            </div>
          ` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">What you'll get:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>🤖 AI-powered conversation summaries</li>
            <li>📊 Team productivity insights</li>
            <li>🔗 Seamless Slack integration</li>
            <li>📄 Multiple export formats</li>
            <li>🎁 Special team member benefits</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ⏰ This invitation expires in 7 days
          </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Don't want to receive invitations? 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #2563eb;">Unsubscribe here</a>
          </p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to: invitation.inviteeEmail,
      subject: `${invitation.inviterName} invited you to join their team on Slack Summary Scribe`,
      html
    });

    if (!emailResult.success) {
      throw new Error('Failed to send invitation email');
    }

    // Track the invitation
    await trackFeatureUsage(invitation.inviterId, 'team_invitation_sent', {
      inviteeEmail: invitation.inviteeEmail,
      workspaceName: invitation.workspaceName
    });

    // Notify team about invitation
    await slackNotifications.userSignup({
      name: invitation.inviterName,
      email: invitation.inviterEmail,
      plan: 'Team Invitation Sent'
    });

    console.log('Team invitation sent:', fullInvitation.id);
    return { success: true, invitation: fullInvitation };
  } catch (error) {
    console.error('Error sending team invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create viral share link
export async function createViralShare(
  userId: string,
  summaryId: string,
  shareType: ViralShare['shareType'],
  options?: {
    recipientEmail?: string;
    expiresIn?: number; // days
    branded?: boolean;
  }
): Promise<{ success: boolean; share?: ViralShare; error?: string }> {
  try {
    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/shared/${shareId}`;
    
    const viralShare: ViralShare = {
      id: shareId,
      userId,
      summaryId,
      shareType,
      recipientEmail: options?.recipientEmail,
      shareUrl,
      viewCount: 0,
      conversionCount: 0,
      createdAt: new Date(),
      expiresAt: options?.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
        : undefined,
      branded: options?.branded ?? VIRAL_GROWTH_CONFIG.sharingBranding.enabled
    };

    // In a real implementation, save to database
    console.log('Viral share created:', viralShare);

    // Track the share creation
    await trackFeatureUsage(userId, 'viral_share_created', {
      shareType,
      summaryId,
      branded: viralShare.branded
    });

    return { success: true, share: viralShare };
  } catch (error) {
    console.error('Error creating viral share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Track referral conversion
export async function trackReferralConversion(
  referralCode: string,
  refereeId: string,
  refereeEmail: string
): Promise<{ success: boolean; conversion?: ReferralConversion; error?: string }> {
  try {
    // In a real implementation, look up referral code from database
    const mockReferralCodeData = {
      id: 'ref-123',
      userId: 'user-456',
      code: referralCode
    };

    const conversion: ReferralConversion = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      referralCodeId: mockReferralCodeData.id,
      referrerId: mockReferralCodeData.userId,
      refereeId,
      refereeEmail,
      conversionDate: new Date(),
      rewardsClaimed: false
    };

    // Track the conversion
    await trackFeatureUsage(mockReferralCodeData.userId, 'referral_conversion', {
      referralCode,
      refereeEmail,
      conversionId: conversion.id
    });

    // Send notification to referrer
    await sendReferralSuccessNotification(mockReferralCodeData.userId, refereeEmail);

    console.log('Referral conversion tracked:', conversion);
    return { success: true, conversion };
  } catch (error) {
    console.error('Error tracking referral conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send referral success notification
async function sendReferralSuccessNotification(
  referrerId: string,
  refereeEmail: string
): Promise<void> {
  try {
    // In a real implementation, get referrer details from database
    const referrerEmail = 'referrer@example.com'; // Mock data
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin-bottom: 10px;">Referral Success! 🎉</h1>
          <p style="color: #6b7280; font-size: 16px;">You've earned rewards for referring a new user</p>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin-bottom: 15px;">Great news!</h2>
          <p style="color: #047857; line-height: 1.6;">
            <strong>${refereeEmail}</strong> just signed up using your referral code!
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Your Rewards:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>🎁 ${VIRAL_GROWTH_CONFIG.referralRewards.referrer.freeMonths} month free Pro subscription</li>
            <li>⭐ ${VIRAL_GROWTH_CONFIG.referralRewards.referrer.credits} bonus credits</li>
            <li>🏆 Referral achievement badge</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Claim Your Rewards
          </a>
        </div>
      </div>
    `;

    await sendEmail({
      to: referrerEmail,
      subject: 'Referral Success - You\'ve earned rewards! 🎉',
      html
    });
  } catch (error) {
    console.error('Error sending referral success notification:', error);
  }
}

// Generate referral analytics
export async function generateReferralAnalytics(userId: string): Promise<{
  totalReferrals: number;
  successfulConversions: number;
  conversionRate: number;
  totalRewards: number;
  recentActivity: Array<{
    type: 'referral' | 'conversion' | 'reward';
    date: Date;
    description: string;
  }>;
}> {
  // In a real implementation, query database for user's referral data
  const mockData = {
    totalReferrals: Math.floor(Math.random() * 20) + 5,
    successfulConversions: Math.floor(Math.random() * 10) + 2,
    conversionRate: 0,
    totalRewards: 0,
    recentActivity: [
      {
        type: 'conversion' as const,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'john@example.com signed up using your referral'
      },
      {
        type: 'reward' as const,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Earned 1 month free Pro subscription'
      },
      {
        type: 'referral' as const,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Sent invitation to sarah@example.com'
      }
    ]
  };

  mockData.conversionRate = mockData.totalReferrals > 0 
    ? (mockData.successfulConversions / mockData.totalReferrals) * 100 
    : 0;
  
  mockData.totalRewards = mockData.successfulConversions * VIRAL_GROWTH_CONFIG.referralRewards.referrer.credits;

  return mockData;
}

// Convenience functions
export const viralGrowth = {
  // Referral system
  createReferralCode: (userId: string, userEmail: string, userName: string) =>
    createReferralCode(userId, userEmail, userName),
  trackConversion: (referralCode: string, refereeId: string, refereeEmail: string) =>
    trackReferralConversion(referralCode, refereeId, refereeEmail),
  
  // Team invitations
  sendInvitation: (invitation: Omit<TeamInvitation, 'id' | 'sentAt' | 'expiresAt' | 'status'>) =>
    sendTeamInvitation(invitation),
  
  // Viral sharing
  createShare: (userId: string, summaryId: string, shareType: ViralShare['shareType'], options?: any) =>
    createViralShare(userId, summaryId, shareType, options),
  
  // Analytics
  getAnalytics: (userId: string) => generateReferralAnalytics(userId)
};
