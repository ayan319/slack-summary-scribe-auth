import { trackFeatureUsage } from './analytics';
import { sendEmail } from './resend';

// Survey configuration
export const SURVEY_CONFIG = {
  triggers: {
    post_summary: {
      delay: 2000, // 2 seconds after summary creation
      probability: 0.3, // 30% chance
      cooldown: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    post_upload: {
      delay: 5000, // 5 seconds after file upload
      probability: 0.2, // 20% chance
      cooldown: 14 * 24 * 60 * 60 * 1000 // 14 days
    },
    weekly_check: {
      delay: 0,
      probability: 1.0, // 100% for scheduled surveys
      cooldown: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    onboarding_complete: {
      delay: 1000, // 1 second after onboarding
      probability: 0.8, // 80% chance
      cooldown: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  },
  questions: {
    nps: {
      type: 'scale',
      question: 'How likely are you to recommend Slack Summary Scribe to a friend or colleague?',
      scale: { min: 0, max: 10 },
      labels: { min: 'Not at all likely', max: 'Extremely likely' }
    },
    satisfaction: {
      type: 'scale',
      question: 'How satisfied are you with Slack Summary Scribe overall?',
      scale: { min: 1, max: 5 },
      labels: { min: 'Very dissatisfied', max: 'Very satisfied' }
    },
    ease_of_use: {
      type: 'scale',
      question: 'How easy is it to use Slack Summary Scribe?',
      scale: { min: 1, max: 5 },
      labels: { min: 'Very difficult', max: 'Very easy' }
    },
    feature_value: {
      type: 'scale',
      question: 'How valuable do you find the AI summarization feature?',
      scale: { min: 1, max: 5 },
      labels: { min: 'Not valuable', max: 'Extremely valuable' }
    }
  }
};

// Survey response interfaces
export interface SurveyResponse {
  id: string;
  userId: string;
  userEmail: string;
  surveyType: 'nps' | 'satisfaction' | 'feature_feedback' | 'onboarding';
  trigger: keyof typeof SURVEY_CONFIG.triggers;
  responses: Record<string, number | string>;
  metadata?: {
    summaryId?: string;
    feature?: string;
    page?: string;
    userAgent?: string;
    timestamp: string;
  };
  submittedAt: Date;
  followUpSent?: boolean;
}

export interface SurveyTrigger {
  userId: string;
  trigger: keyof typeof SURVEY_CONFIG.triggers;
  context?: {
    summaryId?: string;
    feature?: string;
    page?: string;
  };
}

// Check if user should see survey
export async function shouldShowSurvey(
  userId: string,
  trigger: keyof typeof SURVEY_CONFIG.triggers
): Promise<{ shouldShow: boolean; reason?: string }> {
  try {
    const config = SURVEY_CONFIG.triggers[trigger];
    
    // Check probability
    if (Math.random() > config.probability) {
      return { shouldShow: false, reason: 'Probability check failed' };
    }
    
    // Check cooldown (in real implementation, query database)
    const lastSurveyTime = await getLastSurveyTime(userId, trigger);
    if (lastSurveyTime && (Date.now() - lastSurveyTime.getTime()) < config.cooldown) {
      return { shouldShow: false, reason: 'Still in cooldown period' };
    }
    
    // Check if user has been surveyed too much recently
    const recentSurveyCount = await getRecentSurveyCount(userId, 7); // Last 7 days
    if (recentSurveyCount >= 2) {
      return { shouldShow: false, reason: 'Too many recent surveys' };
    }
    
    return { shouldShow: true };
  } catch (error) {
    console.error('Error checking survey eligibility:', error);
    return { shouldShow: false, reason: 'Error checking eligibility' };
  }
}

// Get last survey time for user and trigger
async function getLastSurveyTime(
  userId: string,
  trigger: keyof typeof SURVEY_CONFIG.triggers
): Promise<Date | null> {
  // In real implementation, query database
  // For now, return mock data
  const mockLastSurvey = Math.random() > 0.7 ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null;
  return mockLastSurvey;
}

// Get recent survey count
async function getRecentSurveyCount(userId: string, days: number): Promise<number> {
  // In real implementation, query database
  return Math.floor(Math.random() * 3);
}

// Submit survey response
export async function submitSurveyResponse(
  response: Omit<SurveyResponse, 'id' | 'submittedAt'>
): Promise<{ success: boolean; responseId?: string; error?: string }> {
  try {
    const surveyResponse: SurveyResponse = {
      ...response,
      id: `survey-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      submittedAt: new Date()
    };
    
    // In real implementation, save to database
    console.log('Survey response submitted:', surveyResponse);
    
    // Track the response
    await trackFeatureUsage(response.userId, 'survey_completed', {
      surveyType: response.surveyType,
      trigger: response.trigger,
      responses: response.responses
    });
    
    // Process NPS score
    if (response.surveyType === 'nps' && response.responses.nps_score) {
      await processNPSScore(response.userId, response.responses.nps_score as number);
    }
    
    // Send follow-up if needed
    await scheduleFollowUp(surveyResponse);
    
    return { success: true, responseId: surveyResponse.id };
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process NPS score and categorize user
async function processNPSScore(userId: string, score: number): Promise<void> {
  let category: 'detractor' | 'passive' | 'promoter';
  
  if (score <= 6) {
    category = 'detractor';
  } else if (score <= 8) {
    category = 'passive';
  } else {
    category = 'promoter';
  }
  
  console.log(`User ${userId} is a ${category} with NPS score ${score}`);
  
  // Track NPS category
  await trackFeatureUsage(userId, 'nps_categorized', {
    score,
    category
  });
  
  // Send appropriate follow-up based on category
  if (category === 'detractor') {
    await scheduleDetractorFollowUp(userId, score);
  } else if (category === 'promoter') {
    await schedulePromoterFollowUp(userId, score);
  }
}

// Schedule follow-up actions
async function scheduleFollowUp(response: SurveyResponse): Promise<void> {
  try {
    // For low satisfaction scores, schedule support follow-up
    if (response.responses.satisfaction && (response.responses.satisfaction as number) <= 2) {
      await scheduleSupportFollowUp(response.userId, response.userEmail);
    }
    
    // For feature requests, schedule product team notification
    if (response.responses.feature_request) {
      await scheduleProductTeamNotification(response);
    }
    
    console.log('Follow-up scheduled for survey response:', response.id);
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
  }
}

// Schedule support follow-up for dissatisfied users
async function scheduleSupportFollowUp(userId: string, userEmail: string): Promise<void> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">We'd like to help! 🤝</h1>
          <p style="color: #6b7280; font-size: 16px;">Your feedback is important to us</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #4b5563; line-height: 1.6;">
            Hi there! We noticed you weren't completely satisfied with your recent experience with Slack Summary Scribe. 
            We'd love to understand what went wrong and how we can make it better.
          </p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">How we can help:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>🎯 Personalized onboarding session</li>
            <li>💬 Direct chat with our support team</li>
            <li>📚 Access to advanced tutorials</li>
            <li>🔧 Help with specific features</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/support?source=survey" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Get Help Now
          </a>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; text-align: center;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            💡 You can also reply directly to this email to share more feedback
          </p>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: userEmail,
      subject: 'We\'d like to help improve your experience 🤝',
      html
    });
    
    console.log('Support follow-up email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending support follow-up:', error);
  }
}

// Schedule detractor follow-up
async function scheduleDetractorFollowUp(userId: string, score: number): Promise<void> {
  // In real implementation, this would trigger a workflow to:
  // 1. Alert customer success team
  // 2. Schedule a call or email follow-up
  // 3. Offer additional support or compensation
  console.log(`Detractor follow-up scheduled for user ${userId} with score ${score}`);
}

// Schedule promoter follow-up
async function schedulePromoterFollowUp(userId: string, score: number): Promise<void> {
  // In real implementation, this would:
  // 1. Invite to referral program
  // 2. Ask for testimonial or review
  // 3. Offer early access to new features
  console.log(`Promoter follow-up scheduled for user ${userId} with score ${score}`);
}

// Schedule product team notification
async function scheduleProductTeamNotification(response: SurveyResponse): Promise<void> {
  // In real implementation, this would notify the product team about feature requests
  console.log('Product team notification scheduled for feature request:', response.responses.feature_request);
}

// Generate survey analytics
export async function generateSurveyAnalytics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalResponses: number;
  npsScore: number;
  satisfactionScore: number;
  responsesByTrigger: Record<string, number>;
  trendData: Array<{
    date: string;
    nps: number;
    satisfaction: number;
    responses: number;
  }>;
  detractorCount: number;
  passiveCount: number;
  promoterCount: number;
}> {
  // In real implementation, query database for survey responses
  const mockAnalytics = {
    totalResponses: 234,
    npsScore: 7.2,
    satisfactionScore: 4.1,
    responsesByTrigger: {
      post_summary: 89,
      post_upload: 67,
      weekly_check: 45,
      onboarding_complete: 33
    },
    trendData: [
      { date: '2024-01-15', nps: 6.8, satisfaction: 3.9, responses: 23 },
      { date: '2024-01-16', nps: 7.1, satisfaction: 4.0, responses: 34 },
      { date: '2024-01-17', nps: 7.3, satisfaction: 4.2, responses: 28 },
      { date: '2024-01-18', nps: 7.0, satisfaction: 4.1, responses: 31 },
      { date: '2024-01-19', nps: 7.4, satisfaction: 4.3, responses: 29 }
    ],
    detractorCount: 23,
    passiveCount: 67,
    promoterCount: 144
  };
  
  return mockAnalytics;
}

// Trigger survey for user
export async function triggerSurvey(
  trigger: SurveyTrigger
): Promise<{ success: boolean; shouldShow: boolean; delay?: number }> {
  try {
    const eligibility = await shouldShowSurvey(trigger.userId, trigger.trigger);
    
    if (!eligibility.shouldShow) {
      return { success: true, shouldShow: false };
    }
    
    const config = SURVEY_CONFIG.triggers[trigger.trigger];
    
    // Track the trigger
    await trackFeatureUsage(trigger.userId, 'survey_triggered', {
      trigger: trigger.trigger,
      context: trigger.context
    });
    
    return {
      success: true,
      shouldShow: true,
      delay: config.delay
    };
  } catch (error) {
    console.error('Error triggering survey:', error);
    return { success: false, shouldShow: false };
  }
}

// Convenience functions
export const satisfactionSurveys = {
  // Check eligibility
  shouldShow: (userId: string, trigger: keyof typeof SURVEY_CONFIG.triggers) =>
    shouldShowSurvey(userId, trigger),
  
  // Submit response
  submit: (response: Omit<SurveyResponse, 'id' | 'submittedAt'>) =>
    submitSurveyResponse(response),
  
  // Trigger survey
  trigger: (trigger: SurveyTrigger) => triggerSurvey(trigger),
  
  // Analytics
  getAnalytics: (startDate: Date, endDate: Date) =>
    generateSurveyAnalytics(startDate, endDate),
  
  // Configuration
  config: SURVEY_CONFIG
};
