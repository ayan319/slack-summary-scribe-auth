/**
 * Automated Feedback & Monitoring System
 * In-app feedback prompts, NPS surveys, and health monitoring
 */

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './resend';
import PostHogClient from './posthog.client';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FeedbackPrompt {
  id: string;
  type: 'post_summary' | 'feature_feedback' | 'general';
  title: string;
  message: string;
  cta: string;
  timing: 'immediate' | 'delayed';
  conditions: {
    minSummaries?: number;
    daysSinceSignup?: number;
    lastPromptDays?: number;
  };
}

export interface NPSSurvey {
  userId: string;
  score: number;
  feedback?: string;
  category: 'promoter' | 'passive' | 'detractor';
  followUpSent: boolean;
}

export class AutomatedFeedback {
  
  /**
   * Check if user should see feedback prompt
   */
  static async shouldShowFeedbackPrompt(userId: string, promptType: string): Promise<boolean> {
    try {
      // Get user data
      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (!user) return false;

      // Get user's summary count
      const { data: summaries } = await supabase
        .from('summaries')
        .select('id')
        .eq('user_id', userId);

      const summaryCount = summaries?.length || 0;

      // Get last feedback prompt
      const { data: lastPrompt } = await supabase
        .from('feedback_prompts')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', promptType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysSinceLastPrompt = lastPrompt 
        ? Math.floor((Date.now() - new Date(lastPrompt.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Define prompt conditions
      const conditions = {
        post_summary: summaryCount >= 3 && daysSinceLastPrompt >= 7,
        feature_feedback: summaryCount >= 10 && daysSinceSignup >= 14 && daysSinceLastPrompt >= 30,
        general: daysSinceSignup >= 7 && daysSinceLastPrompt >= 14
      };

      return conditions[promptType as keyof typeof conditions] || false;
    } catch (error) {
      console.error('Error checking feedback prompt conditions:', error);
      return false;
    }
  }

  /**
   * Show in-app feedback prompt
   */
  static async showFeedbackPrompt(userId: string, promptType: string): Promise<FeedbackPrompt | null> {
    try {
      const shouldShow = await this.shouldShowFeedbackPrompt(userId, promptType);
      if (!shouldShow) return null;

      const prompts = {
        post_summary: {
          id: `prompt_${Date.now()}`,
          type: 'post_summary' as const,
          title: 'How was your summary?',
          message: 'We\'d love to hear your thoughts on the summary quality and usefulness.',
          cta: 'Give Feedback',
          timing: 'immediate' as const,
          conditions: { minSummaries: 3, lastPromptDays: 7 }
        },
        feature_feedback: {
          id: `prompt_${Date.now()}`,
          type: 'feature_feedback' as const,
          title: 'Help us improve!',
          message: 'What features would make Slack Summary Scribe even better for you?',
          cta: 'Share Ideas',
          timing: 'delayed' as const,
          conditions: { minSummaries: 10, daysSinceSignup: 14, lastPromptDays: 30 }
        },
        general: {
          id: `prompt_${Date.now()}`,
          type: 'general' as const,
          title: 'Quick feedback?',
          message: 'How has your experience been with Slack Summary Scribe so far?',
          cta: 'Tell Us',
          timing: 'delayed' as const,
          conditions: { daysSinceSignup: 7, lastPromptDays: 14 }
        }
      };

      const prompt = prompts[promptType as keyof typeof prompts];
      if (!prompt) return null;

      // Record prompt shown
      await supabase
        .from('feedback_prompts')
        .insert({
          user_id: userId,
          type: promptType,
          prompt_id: prompt.id,
          shown_at: new Date().toISOString()
        });

      // Track in analytics
      PostHogClient.track('feedback_prompt_shown', {
        user_id: userId,
        prompt_type: promptType,
        prompt_id: prompt.id
      });

      return prompt;
    } catch (error) {
      console.error('Error showing feedback prompt:', error);
      Sentry.captureException(error);
      return null;
    }
  }

  /**
   * Process feedback submission
   */
  static async submitFeedback(userId: string, promptId: string, feedback: string, rating?: number) {
    try {
      // Save feedback
      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          prompt_id: promptId,
          feedback,
          rating,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Track submission
      PostHogClient.track('feedback_submitted', {
        user_id: userId,
        prompt_id: promptId,
        rating,
        feedback_length: feedback.length
      });

      // Send notification to team
      await this.notifyTeamOfFeedback(data);

      return { success: true, feedbackId: data.id };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Sentry.captureException(error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if user should receive NPS survey
   */
  static async shouldSendNPSSurvey(userId: string): Promise<boolean> {
    try {
      // Get user signup date
      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (!user) return false;

      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if already sent NPS survey
      const { data: existingSurvey } = await supabase
        .from('nps_surveys')
        .select('id')
        .eq('user_id', userId)
        .single();

      // Send NPS after 7 days, only once
      return daysSinceSignup >= 7 && !existingSurvey;
    } catch (error) {
      console.error('Error checking NPS survey conditions:', error);
      return false;
    }
  }

  /**
   * Send NPS survey email
   */
  static async sendNPSSurvey(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const shouldSend = await this.shouldSendNPSSurvey(userId);
      if (!shouldSend) {
        return { success: false, error: 'User not eligible for NPS survey' };
      }

      // Get user email
      const { data: user } = await supabase
        .from('users')
        .select('email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const userName = user.raw_user_meta_data?.full_name || 'there';
      const surveyId = `nps_${userId}_${Date.now()}`;
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      // Create NPS survey record
      await supabase
        .from('nps_surveys')
        .insert({
          id: surveyId,
          user_id: userId,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      // Generate NPS survey HTML
      const npsHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>How likely are you to recommend us?</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">📊 Quick Question</h1>
            <p style="font-size: 18px; margin-bottom: 30px;">Hi ${userName}! How likely are you to recommend Slack Summary Scribe to a friend or colleague?</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 20px; font-weight: 600;">Click your score (0 = Not at all likely, 10 = Extremely likely):</p>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              ${Array.from({ length: 11 }, (_, i) => `
                <a href="${baseUrl}/api/nps-response?survey=${surveyId}&score=${i}" 
                   style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 2px;">
                  ${i}
                </a>
              `).join('')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280;">
              This helps us understand how we're doing and improve our service.<br>
              Thank you for using Slack Summary Scribe! 🙏
            </p>
          </div>
        </body>
        </html>
      `;

      // Send email
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Quick question: How likely are you to recommend us?',
        html: npsHtml
      });

      if (!emailResult.success) {
        return { success: false, error: emailResult.error };
      }

      // Track NPS survey sent
      PostHogClient.track('nps_survey_sent', {
        user_id: userId,
        survey_id: surveyId
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending NPS survey:', error);
      Sentry.captureException(error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process NPS survey response
   */
  static async processNPSResponse(surveyId: string, score: number, feedback?: string): Promise<NPSSurvey> {
    try {
      // Determine category
      let category: 'promoter' | 'passive' | 'detractor';
      if (score >= 9) category = 'promoter';
      else if (score >= 7) category = 'passive';
      else category = 'detractor';

      // Update survey record
      const { data, error } = await supabase
        .from('nps_surveys')
        .update({
          score,
          feedback,
          category,
          responded_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', surveyId)
        .select('user_id')
        .single();

      if (error) throw error;

      // Track response
      PostHogClient.track('nps_response', {
        user_id: data.user_id,
        survey_id: surveyId,
        score,
        category,
        has_feedback: !!feedback
      });

      // Send follow-up based on score
      await this.sendNPSFollowUp(data.user_id, category, score);

      return {
        userId: data.user_id,
        score,
        feedback,
        category,
        followUpSent: true
      };
    } catch (error) {
      console.error('Error processing NPS response:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Send follow-up based on NPS score
   */
  private static async sendNPSFollowUp(userId: string, category: string, score: number) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      if (!user) return;

      const userName = user.raw_user_meta_data?.full_name || 'there';
      let subject = '';
      let html = '';

      if (category === 'promoter') {
        subject = 'Thank you! Would you mind sharing the love? 💙';
        html = `
          <h2>Thank you so much! 🎉</h2>
          <p>Hi ${userName},</p>
          <p>We're thrilled that you'd recommend Slack Summary Scribe! Your score of ${score} means the world to us.</p>
          <p>Would you mind helping us spread the word? Here are a few ways:</p>
          <ul>
            <li><a href="${process.env.NEXT_PUBLIC_SITE_URL}/referral">Invite your team</a> and get premium features</li>
            <li>Share on social media (we'd love a mention!)</li>
            <li>Leave a review on Product Hunt when we launch</li>
          </ul>
          <p>Thank you for being an amazing user! 🙏</p>
        `;
      } else if (category === 'passive') {
        subject = 'How can we make Slack Summary Scribe even better?';
        html = `
          <h2>Thanks for your feedback! 📈</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for rating us ${score}/10. We're always looking to improve!</p>
          <p>What would make Slack Summary Scribe a 10/10 for you?</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/feedback">Share your thoughts</a> - we read every response.</p>
          <p>Your input helps us build a better product for everyone.</p>
        `;
      } else {
        subject = 'We\'d love to make this right';
        html = `
          <h2>We want to do better 🤝</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for your honest feedback. A score of ${score} tells us we have work to do.</p>
          <p>We'd love to understand what went wrong and how we can improve your experience.</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/support">Reach out to our team</a> - we're here to help.</p>
          <p>Your success is our success, and we're committed to making this right.</p>
        `;
      }

      await sendEmail({
        to: user.email,
        subject,
        html
      });

      // Track follow-up sent
      PostHogClient.track('nps_followup_sent', {
        user_id: userId,
        category,
        score
      });
    } catch (error) {
      console.error('Error sending NPS follow-up:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Notify team of important feedback
   */
  private static async notifyTeamOfFeedback(feedback: any) {
    try {
      // Only notify for high-priority feedback
      if (feedback.rating && feedback.rating <= 2) {
        // Send to team Slack or email
        const message = `🚨 Low rating feedback received (${feedback.rating}/5):\n"${feedback.feedback}"`;
        
        // You could integrate with Slack webhook here
        console.log('Team notification:', message);
        
        // Track critical feedback
        PostHogClient.track('critical_feedback_received', {
          feedback_id: feedback.id,
          rating: feedback.rating,
          user_id: feedback.user_id
        });
      }
    } catch (error) {
      console.error('Error notifying team:', error);
    }
  }

  /**
   * Get health monitoring metrics
   */
  static async getHealthMetrics() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Error rate from Sentry
      const errorCount = await this.getSentryErrorCount(last24h);
      
      // User activity
      const { data: activeUsers } = await supabase
        .from('users')
        .select('id')
        .gte('last_sign_in_at', last24h.toISOString());

      // System performance
      const { data: summaries } = await supabase
        .from('summaries')
        .select('id, created_at')
        .gte('created_at', last24h.toISOString());

      return {
        errorCount,
        activeUsers: activeUsers?.length || 0,
        summariesGenerated: summaries?.length || 0,
        systemHealth: errorCount < 10 ? 'healthy' : errorCount < 50 ? 'warning' : 'critical',
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      console.error('Error getting health metrics:', error);
      return {
        errorCount: 0,
        activeUsers: 0,
        summariesGenerated: 0,
        systemHealth: 'unknown',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private static async getSentryErrorCount(since: Date): Promise<number> {
    // This would integrate with Sentry API to get error count
    // For now, return 0 as placeholder
    return 0;
  }
}

export default AutomatedFeedback;
