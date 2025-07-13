import { trackFeatureUsage } from './analytics';

// Referral source tracking configuration
export const REFERRAL_TRACKING_CONFIG = {
  sources: {
    organic: 'Organic',
    google: 'Google Search',
    social: 'Social Media',
    email: 'Email Campaign',
    referral: 'User Referral',
    slack: 'Slack Integration',
    content: 'Content Marketing',
    paid: 'Paid Advertising',
    partner: 'Partner',
    direct: 'Direct'
  },
  utmParameters: {
    source: 'utm_source',
    medium: 'utm_medium',
    campaign: 'utm_campaign',
    term: 'utm_term',
    content: 'utm_content'
  },
  cookieExpiry: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Referral source data interface
export interface ReferralSource {
  id: string;
  userId?: string;
  sessionId: string;
  source: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  landingPage: string;
  userAgent: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  timestamp: Date;
  converted: boolean;
  conversionDate?: Date;
  conversionValue?: number;
}

// Attribution data interface
export interface AttributionData {
  firstTouch: ReferralSource;
  lastTouch: ReferralSource;
  touchpoints: ReferralSource[];
  conversionPath: string[];
  timeToConversion?: number; // in hours
  touchpointCount: number;
}

// Campaign performance interface
export interface CampaignPerformance {
  campaign: string;
  source: string;
  medium: string;
  visitors: number;
  signups: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  costPerAcquisition?: number;
  returnOnAdSpend?: number;
  averageOrderValue: number;
}

// Track referral source from URL parameters
export function trackReferralSource(
  url: string,
  referrer?: string,
  userAgent?: string
): ReferralSource {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  // Extract UTM parameters
  const utmSource = params.get(REFERRAL_TRACKING_CONFIG.utmParameters.source);
  const utmMedium = params.get(REFERRAL_TRACKING_CONFIG.utmParameters.medium);
  const utmCampaign = params.get(REFERRAL_TRACKING_CONFIG.utmParameters.campaign);
  const utmTerm = params.get(REFERRAL_TRACKING_CONFIG.utmParameters.term);
  const utmContent = params.get(REFERRAL_TRACKING_CONFIG.utmParameters.content);
  
  // Determine source
  let source = 'direct';
  let medium = '';
  
  if (utmSource) {
    source = utmSource;
    medium = utmMedium || '';
  } else if (referrer) {
    source = determineSourceFromReferrer(referrer);
    medium = 'referral';
  }
  
  const referralSource: ReferralSource = {
    id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    sessionId: generateSessionId(),
    source,
    medium: utmMedium || medium,
    campaign: utmCampaign || undefined,
    term: utmTerm || undefined,
    content: utmContent || undefined,
    referrer,
    landingPage: urlObj.pathname,
    userAgent: userAgent || '',
    timestamp: new Date(),
    converted: false
  };
  
  return referralSource;
}

// Determine source from referrer URL
function determineSourceFromReferrer(referrer: string): string {
  try {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname.toLowerCase();
    
    // Social media platforms
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
    if (hostname.includes('twitter.com') || hostname.includes('t.co')) return 'twitter';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('youtube.com')) return 'youtube';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    
    // Search engines
    if (hostname.includes('google.com')) return 'google';
    if (hostname.includes('bing.com')) return 'bing';
    if (hostname.includes('yahoo.com')) return 'yahoo';
    if (hostname.includes('duckduckgo.com')) return 'duckduckgo';
    
    // Other platforms
    if (hostname.includes('slack.com')) return 'slack';
    if (hostname.includes('github.com')) return 'github';
    if (hostname.includes('reddit.com')) return 'reddit';
    if (hostname.includes('hackernews.com') || hostname.includes('ycombinator.com')) return 'hackernews';
    
    // Default to domain name
    return hostname.replace('www.', '');
  } catch (error) {
    return 'unknown';
  }
}

// Generate session ID
function generateSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
}

// Store referral source (would integrate with your database)
export async function storeReferralSource(
  referralSource: ReferralSource
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, save to database
    console.log('Storing referral source:', referralSource);
    
    // Track in analytics
    await trackFeatureUsage(
      referralSource.userId || 'anonymous',
      'referral_source_tracked',
      {
        source: referralSource.source,
        medium: referralSource.medium,
        campaign: referralSource.campaign,
        landingPage: referralSource.landingPage
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error storing referral source:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Track conversion for referral source
export async function trackReferralConversion(
  sessionId: string,
  userId: string,
  conversionValue?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, update the referral source record
    console.log('Tracking referral conversion:', { sessionId, userId, conversionValue });
    
    // Track conversion in analytics
    await trackFeatureUsage(userId, 'referral_conversion_tracked', {
      sessionId,
      conversionValue: conversionValue || 0
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking referral conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get attribution data for user
export async function getUserAttribution(userId: string): Promise<AttributionData | null> {
  try {
    // In a real implementation, query database for user's touchpoints
    // For now, return mock data
    const mockTouchpoints: ReferralSource[] = [
      {
        id: 'ref-1',
        sessionId: 'sess-1',
        userId,
        source: 'google',
        medium: 'organic',
        landingPage: '/',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        converted: false
      },
      {
        id: 'ref-2',
        sessionId: 'sess-2',
        userId,
        source: 'facebook',
        medium: 'social',
        campaign: 'launch_campaign',
        landingPage: '/pricing',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        converted: false
      },
      {
        id: 'ref-3',
        sessionId: 'sess-3',
        userId,
        source: 'email',
        medium: 'newsletter',
        campaign: 'weekly_digest',
        landingPage: '/dashboard',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(),
        converted: true,
        conversionDate: new Date()
      }
    ];
    
    const firstTouch = mockTouchpoints[0];
    const lastTouch = mockTouchpoints[mockTouchpoints.length - 1];
    const conversionPath = mockTouchpoints.map(tp => tp.source);
    const timeToConversion = (lastTouch.timestamp.getTime() - firstTouch.timestamp.getTime()) / (1000 * 60 * 60);
    
    return {
      firstTouch,
      lastTouch,
      touchpoints: mockTouchpoints,
      conversionPath,
      timeToConversion,
      touchpointCount: mockTouchpoints.length
    };
  } catch (error) {
    console.error('Error getting user attribution:', error);
    return null;
  }
}

// Generate campaign performance report
export async function generateCampaignPerformance(
  startDate: Date,
  endDate: Date
): Promise<CampaignPerformance[]> {
  try {
    // In a real implementation, query database for campaign data
    // For now, return mock data
    const mockCampaigns: CampaignPerformance[] = [
      {
        campaign: 'launch_campaign',
        source: 'facebook',
        medium: 'social',
        visitors: 1250,
        signups: 89,
        conversions: 23,
        revenue: 1150,
        conversionRate: 25.8,
        costPerAcquisition: 50,
        returnOnAdSpend: 2.3,
        averageOrderValue: 50
      },
      {
        campaign: 'google_ads_pro',
        source: 'google',
        medium: 'cpc',
        visitors: 890,
        signups: 67,
        conversions: 19,
        revenue: 950,
        conversionRate: 28.4,
        costPerAcquisition: 45,
        returnOnAdSpend: 2.1,
        averageOrderValue: 50
      },
      {
        campaign: 'content_marketing',
        source: 'blog',
        medium: 'organic',
        visitors: 2100,
        signups: 156,
        conversions: 34,
        revenue: 1700,
        conversionRate: 21.8,
        averageOrderValue: 50
      },
      {
        campaign: 'email_newsletter',
        source: 'email',
        medium: 'newsletter',
        visitors: 450,
        signups: 78,
        conversions: 28,
        revenue: 1400,
        conversionRate: 35.9,
        averageOrderValue: 50
      },
      {
        campaign: 'referral_program',
        source: 'referral',
        medium: 'user_referral',
        visitors: 320,
        signups: 89,
        conversions: 45,
        revenue: 2250,
        conversionRate: 50.6,
        averageOrderValue: 50
      }
    ];
    
    return mockCampaigns;
  } catch (error) {
    console.error('Error generating campaign performance:', error);
    return [];
  }
}

// Get top referral sources
export async function getTopReferralSources(
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<Array<{
  source: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}>> {
  try {
    // In a real implementation, query database
    const mockSources = [
      { source: 'google', visitors: 2890, conversions: 234, conversionRate: 8.1, revenue: 11700 },
      { source: 'facebook', visitors: 1250, conversions: 89, conversionRate: 7.1, revenue: 4450 },
      { source: 'referral', visitors: 890, conversions: 156, conversionRate: 17.5, revenue: 7800 },
      { source: 'email', visitors: 670, conversions: 123, conversionRate: 18.4, revenue: 6150 },
      { source: 'linkedin', visitors: 450, conversions: 67, conversionRate: 14.9, revenue: 3350 },
      { source: 'twitter', visitors: 320, conversions: 34, conversionRate: 10.6, revenue: 1700 },
      { source: 'slack', visitors: 280, conversions: 45, conversionRate: 16.1, revenue: 2250 },
      { source: 'github', visitors: 190, conversions: 23, conversionRate: 12.1, revenue: 1150 },
      { source: 'reddit', visitors: 150, conversions: 12, conversionRate: 8.0, revenue: 600 },
      { source: 'hackernews', visitors: 120, conversions: 8, conversionRate: 6.7, revenue: 400 }
    ];
    
    return mockSources.slice(0, limit);
  } catch (error) {
    console.error('Error getting top referral sources:', error);
    return [];
  }
}

// Client-side tracking utilities
export const clientTracking = {
  // Track page view with referral data
  trackPageView: (url: string, referrer?: string) => {
    if (typeof window === 'undefined') return;
    
    const referralSource = trackReferralSource(url, referrer, navigator.userAgent);
    
    // Store in localStorage for session tracking
    localStorage.setItem('referralSource', JSON.stringify(referralSource));
    
    // Send to analytics
    return storeReferralSource(referralSource);
  },
  
  // Get stored referral source
  getReferralSource: (): ReferralSource | null => {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('referralSource');
    return stored ? JSON.parse(stored) : null;
  },
  
  // Track conversion
  trackConversion: (userId: string, conversionValue?: number) => {
    const referralSource = clientTracking.getReferralSource();
    if (!referralSource) return;
    
    return trackReferralConversion(referralSource.sessionId, userId, conversionValue);
  }
};

// Convenience functions
export const referralTracking = {
  // Tracking functions
  trackSource: (url: string, referrer?: string, userAgent?: string) =>
    trackReferralSource(url, referrer, userAgent),
  storeSource: (source: ReferralSource) => storeReferralSource(source),
  trackConversion: (sessionId: string, userId: string, value?: number) =>
    trackReferralConversion(sessionId, userId, value),
  
  // Analytics functions
  getUserAttribution: (userId: string) => getUserAttribution(userId),
  getCampaignPerformance: (startDate: Date, endDate: Date) =>
    generateCampaignPerformance(startDate, endDate),
  getTopSources: (startDate: Date, endDate: Date, limit?: number) =>
    getTopReferralSources(startDate, endDate, limit),
  
  // Client-side utilities
  client: clientTracking
};
