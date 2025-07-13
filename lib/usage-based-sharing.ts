import { trackFeatureUsage } from './analytics';

// Usage-based sharing configuration
export const SHARING_CONFIG = {
  plans: {
    free: {
      maxShares: 5,
      maxViews: 50,
      brandingRequired: true,
      expiryDays: 7,
      features: ['basic_sharing', 'branding']
    },
    pro: {
      maxShares: 50,
      maxViews: 1000,
      brandingRequired: false,
      expiryDays: 30,
      features: ['basic_sharing', 'custom_branding', 'analytics', 'password_protection']
    },
    enterprise: {
      maxShares: -1, // unlimited
      maxViews: -1, // unlimited
      brandingRequired: false,
      expiryDays: 365,
      features: ['basic_sharing', 'custom_branding', 'analytics', 'password_protection', 'custom_domain', 'white_label']
    }
  },
  branding: {
    default: {
      logoUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      brandName: 'Slack Summary Scribe',
      tagline: 'AI-Powered Conversation Summaries',
      websiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#059669'
      }
    }
  }
};

// Shared content interfaces
export interface SharedSummary {
  id: string;
  summaryId: string;
  userId: string;
  userPlan: 'free' | 'pro' | 'enterprise';
  title: string;
  content: string;
  summary: string;
  shareUrl: string;
  shareToken: string;
  viewCount: number;
  maxViews: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  passwordProtected: boolean;
  password?: string;
  branding: BrandingConfig;
  analytics: ShareAnalytics;
  metadata?: Record<string, any>;
}

export interface BrandingConfig {
  enabled: boolean;
  logoUrl?: string;
  brandName?: string;
  tagline?: string;
  websiteUrl?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customCss?: string;
  watermark?: boolean;
}

export interface ShareAnalytics {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Record<string, number>;
  viewsByCountry: Record<string, number>;
  viewsByReferrer: Record<string, number>;
  averageViewDuration: number;
  bounceRate: number;
  conversionRate: number;
  lastViewedAt?: Date;
}

export interface ShareView {
  id: string;
  shareId: string;
  viewerIp?: string;
  viewerCountry?: string;
  viewerCity?: string;
  userAgent: string;
  referrer?: string;
  viewedAt: Date;
  viewDuration?: number;
  converted: boolean;
  conversionType?: 'signup' | 'trial' | 'purchase';
}

// Generate share token
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Create shared summary
export async function createSharedSummary(
  summaryId: string,
  userId: string,
  userPlan: 'free' | 'pro' | 'enterprise',
  options?: {
    title?: string;
    password?: string;
    expiryDays?: number;
    customBranding?: Partial<BrandingConfig>;
    maxViews?: number;
  }
): Promise<{ success: boolean; share?: SharedSummary; error?: string }> {
  try {
    const planConfig = SHARING_CONFIG.plans[userPlan];
    const shareToken = generateShareToken();
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/shared/${shareToken}`;
    
    // Check user limits (in real implementation, query database)
    const userShares = await getUserShareCount(userId);
    if (planConfig.maxShares !== -1 && userShares >= planConfig.maxShares) {
      return {
        success: false,
        error: `Share limit reached. ${userPlan} plan allows ${planConfig.maxShares} shares.`
      };
    }
    
    // Calculate expiry date
    const expiryDays = options?.expiryDays || planConfig.expiryDays;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    
    // Configure branding
    const branding: BrandingConfig = {
      enabled: planConfig.brandingRequired || (options?.customBranding?.enabled ?? true),
      ...SHARING_CONFIG.branding.default,
      ...options?.customBranding
    };
    
    // Set max views
    const maxViews = options?.maxViews || planConfig.maxViews;
    
    const sharedSummary: SharedSummary = {
      id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      summaryId,
      userId,
      userPlan,
      title: options?.title || 'AI Summary',
      content: 'Mock content', // In real implementation, fetch from database
      summary: 'Mock summary', // In real implementation, fetch from database
      shareUrl,
      shareToken,
      viewCount: 0,
      maxViews: maxViews === -1 ? 999999 : maxViews,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      passwordProtected: !!options?.password,
      password: options?.password,
      branding,
      analytics: {
        totalViews: 0,
        uniqueViews: 0,
        viewsByDate: {},
        viewsByCountry: {},
        viewsByReferrer: {},
        averageViewDuration: 0,
        bounceRate: 0,
        conversionRate: 0
      }
    };
    
    // In real implementation, save to database
    console.log('Shared summary created:', sharedSummary.id);
    
    // Track the share creation
    await trackFeatureUsage(userId, 'summary_shared', {
      shareId: sharedSummary.id,
      userPlan,
      passwordProtected: sharedSummary.passwordProtected,
      expiryDays,
      brandingEnabled: branding.enabled
    });
    
    return { success: true, share: sharedSummary };
  } catch (error) {
    console.error('Error creating shared summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get user's current share count
async function getUserShareCount(userId: string): Promise<number> {
  // In real implementation, query database
  return Math.floor(Math.random() * 10);
}

// Track share view
export async function trackShareView(
  shareToken: string,
  viewerData: {
    ip?: string;
    country?: string;
    city?: string;
    userAgent: string;
    referrer?: string;
  }
): Promise<{ success: boolean; canView: boolean; share?: SharedSummary; error?: string }> {
  try {
    // In real implementation, fetch share from database by token
    const mockShare: SharedSummary = {
      id: 'share-123',
      summaryId: 'summary-456',
      userId: 'user-789',
      userPlan: 'pro',
      title: 'Team Meeting Summary',
      content: 'Mock content',
      summary: 'Mock summary',
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/shared/${shareToken}`,
      shareToken,
      viewCount: 5,
      maxViews: 100,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      isActive: true,
      passwordProtected: false,
      branding: {
        enabled: true,
        ...SHARING_CONFIG.branding.default
      },
      analytics: {
        totalViews: 5,
        uniqueViews: 4,
        viewsByDate: {},
        viewsByCountry: {},
        viewsByReferrer: {},
        averageViewDuration: 120,
        bounceRate: 0.2,
        conversionRate: 0.1
      }
    };
    
    // Check if share is valid
    if (!mockShare.isActive) {
      return { success: false, canView: false, error: 'Share is no longer active' };
    }
    
    if (new Date() > mockShare.expiresAt) {
      return { success: false, canView: false, error: 'Share has expired' };
    }
    
    if (mockShare.viewCount >= mockShare.maxViews) {
      return { success: false, canView: false, error: 'Share view limit reached' };
    }
    
    // Create view record
    const shareView: ShareView = {
      id: `view-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      shareId: mockShare.id,
      viewerIp: viewerData.ip,
      viewerCountry: viewerData.country,
      viewerCity: viewerData.city,
      userAgent: viewerData.userAgent,
      referrer: viewerData.referrer,
      viewedAt: new Date(),
      converted: false
    };
    
    // Update share analytics
    mockShare.viewCount++;
    mockShare.analytics.totalViews++;
    
    const today = new Date().toISOString().split('T')[0];
    mockShare.analytics.viewsByDate[today] = (mockShare.analytics.viewsByDate[today] || 0) + 1;
    
    if (viewerData.country) {
      mockShare.analytics.viewsByCountry[viewerData.country] = 
        (mockShare.analytics.viewsByCountry[viewerData.country] || 0) + 1;
    }
    
    if (viewerData.referrer) {
      const referrerDomain = new URL(viewerData.referrer).hostname;
      mockShare.analytics.viewsByReferrer[referrerDomain] = 
        (mockShare.analytics.viewsByReferrer[referrerDomain] || 0) + 1;
    }
    
    mockShare.analytics.lastViewedAt = new Date();
    
    // Track the view
    await trackFeatureUsage(mockShare.userId, 'shared_summary_viewed', {
      shareId: mockShare.id,
      viewerCountry: viewerData.country,
      referrer: viewerData.referrer
    });
    
    console.log('Share view tracked:', shareView.id);
    
    return { success: true, canView: true, share: mockShare };
  } catch (error) {
    console.error('Error tracking share view:', error);
    return {
      success: false,
      canView: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Track share conversion
export async function trackShareConversion(
  shareToken: string,
  conversionType: 'signup' | 'trial' | 'purchase',
  conversionValue?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // In real implementation, update share analytics
    console.log('Share conversion tracked:', { shareToken, conversionType, conversionValue });
    
    // Track the conversion
    await trackFeatureUsage('anonymous', 'shared_summary_conversion', {
      shareToken,
      conversionType,
      conversionValue: conversionValue || 0
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking share conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get user's share analytics
export async function getUserShareAnalytics(userId: string): Promise<{
  totalShares: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  topShares: Array<{
    id: string;
    title: string;
    views: number;
    conversions: number;
    createdAt: Date;
  }>;
  viewsByDate: Record<string, number>;
  viewsByCountry: Record<string, number>;
}> {
  try {
    // In real implementation, query database for user's shares
    const mockAnalytics = {
      totalShares: 12,
      totalViews: 456,
      totalConversions: 23,
      conversionRate: 5.04,
      topShares: [
        {
          id: 'share-1',
          title: 'Q4 Planning Meeting',
          views: 89,
          conversions: 7,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'share-2',
          title: 'Product Roadmap Discussion',
          views: 67,
          conversions: 5,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'share-3',
          title: 'Team Retrospective',
          views: 45,
          conversions: 3,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
        }
      ],
      viewsByDate: {
        '2024-01-15': 23,
        '2024-01-16': 34,
        '2024-01-17': 45,
        '2024-01-18': 56,
        '2024-01-19': 67
      },
      viewsByCountry: {
        'United States': 234,
        'Canada': 89,
        'United Kingdom': 67,
        'Germany': 45,
        'Australia': 21
      }
    };
    
    return mockAnalytics;
  } catch (error) {
    console.error('Error getting user share analytics:', error);
    throw error;
  }
}

// Generate branded share page HTML
export function generateBrandedSharePage(share: SharedSummary): string {
  const branding = share.branding;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${share.title}</title>
      <style>
        :root {
          --primary-color: ${branding.colors?.primary || '#2563eb'};
          --secondary-color: ${branding.colors?.secondary || '#64748b'};
          --accent-color: ${branding.colors?.accent || '#059669'};
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f8fafc;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .logo {
          max-height: 40px;
          margin-bottom: 10px;
        }
        
        .brand-name {
          color: var(--primary-color);
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .tagline {
          color: var(--secondary-color);
          font-size: 14px;
        }
        
        .content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .title {
          color: var(--primary-color);
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        
        .summary {
          background: #f1f5f9;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid var(--accent-color);
          margin-bottom: 20px;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .cta {
          display: inline-block;
          background: var(--primary-color);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 10px;
        }
        
        .watermark {
          position: fixed;
          bottom: 20px;
          right: 20px;
          opacity: 0.7;
          font-size: 12px;
          color: var(--secondary-color);
        }
        
        ${branding.customCss || ''}
      </style>
    </head>
    <body>
      ${branding.enabled ? `
        <div class="header">
          ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.brandName}" class="logo">` : ''}
          <div class="brand-name">${branding.brandName || 'Slack Summary Scribe'}</div>
          <div class="tagline">${branding.tagline || 'AI-Powered Conversation Summaries'}</div>
        </div>
      ` : ''}
      
      <div class="content">
        <h1 class="title">${share.title}</h1>
        
        <div class="summary">
          <h3>Summary</h3>
          <p>${share.summary}</p>
        </div>
        
        <div class="full-content">
          <h3>Full Content</h3>
          <div>${share.content}</div>
        </div>
      </div>
      
      ${branding.enabled ? `
        <div class="footer">
          <p>Want to create your own AI summaries?</p>
          <a href="${branding.websiteUrl}" class="cta">Try ${branding.brandName}</a>
        </div>
      ` : ''}
      
      ${branding.watermark ? `
        <div class="watermark">
          Powered by ${branding.brandName}
        </div>
      ` : ''}
      
      <script>
        // Track view duration
        const startTime = Date.now();
        window.addEventListener('beforeunload', function() {
          const duration = Date.now() - startTime;
          navigator.sendBeacon('/api/shares/${share.shareToken}/duration', JSON.stringify({ duration }));
        });
      </script>
    </body>
    </html>
  `;
}

// Convenience functions
export const usageBasedSharing = {
  // Share management
  createShare: (summaryId: string, userId: string, userPlan: 'free' | 'pro' | 'enterprise', options?: any) =>
    createSharedSummary(summaryId, userId, userPlan, options),
  
  // View tracking
  trackView: (shareToken: string, viewerData: any) => trackShareView(shareToken, viewerData),
  trackConversion: (shareToken: string, conversionType: 'signup' | 'trial' | 'purchase', value?: number) =>
    trackShareConversion(shareToken, conversionType, value),
  
  // Analytics
  getUserAnalytics: (userId: string) => getUserShareAnalytics(userId),
  
  // Branding
  generatePage: (share: SharedSummary) => generateBrandedSharePage(share)
};
