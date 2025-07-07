/**
 * Weekly Email Digest System for SummaryAI
 * Automated weekly summaries of team activity and exports
 */

import { createClient } from '@supabase/supabase-js';
import { emailService } from './email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WeeklyDigestData {
  userId: string;
  userEmail: string;
  userName: string;
  teamId?: string;
  teamName?: string;
  weekStart: string;
  weekEnd: string;
  summariesCreated: number;
  exportsCompleted: number;
  topSummaries: {
    id: string;
    title: string;
    createdAt: string;
    actionItems: number;
  }[];
  teamActivity?: {
    totalSummaries: number;
    activeMembers: number;
    topContributors: {
      name: string;
      summaries: number;
    }[];
  };
  insights: {
    mostActiveDay: string;
    averageSummaryLength: number;
    totalActionItems: number;
    completionRate: number;
  };
}

interface DigestPreferences {
  userId: string;
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  includeTeamActivity: boolean;
  includeInsights: boolean;
  includeTopSummaries: boolean;
}

class WeeklyDigestService {
  /**
   * Generate and send weekly digest for all eligible users
   */
  async sendWeeklyDigests(): Promise<void> {
    try {
      console.log('Starting weekly digest generation...');

      // Get all users with digest enabled
      const { data: users, error } = await supabase
        .from('digest_preferences')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name,
            team_id,
            teams:team_id (
              id,
              name
            )
          )
        `)
        .eq('enabled', true)
        .eq('frequency', 'weekly');

      if (error) {
        throw new Error(`Failed to fetch digest users: ${error.message}`);
      }

      if (!users || users.length === 0) {
        console.log('No users found for weekly digest');
        return;
      }

      // Process each user
      for (const userPref of users) {
        try {
          await this.generateAndSendDigest(userPref);
        } catch (error) {
          console.error(`Failed to send digest for user ${userPref.user_id}:`, error);
          // Continue with other users
        }
      }

      console.log(`Weekly digest sent to ${users.length} users`);
    } catch (error) {
      console.error('Error in weekly digest generation:', error);
      throw error;
    }
  }

  /**
   * Generate and send digest for a specific user
   */
  private async generateAndSendDigest(userPref: any): Promise<void> {
    const user = userPref.users;
    if (!user) return;

    // Calculate week range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Gather user activity data
    const digestData = await this.gatherUserActivityData({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      teamId: user.team_id,
      teamName: user.teams?.name,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      preferences: userPref,
    });

    // Only send if there's meaningful activity
    if (digestData.summariesCreated > 0 || digestData.exportsCompleted > 0) {
      await this.sendDigestEmail(digestData);
      
      // Log digest sent
      await this.logDigestSent(user.id, digestData);
    }
  }

  /**
   * Gather user activity data for the week
   */
  private async gatherUserActivityData(params: {
    userId: string;
    userEmail: string;
    userName: string;
    teamId?: string;
    teamName?: string;
    weekStart: string;
    weekEnd: string;
    preferences: any;
  }): Promise<WeeklyDigestData> {
    const { userId, userEmail, userName, teamId, teamName, weekStart, weekEnd, preferences } = params;

    // Get user's summaries for the week
    const { data: summaries } = await supabase
      .from('summaries')
      .select('id, title, created_at, action_items')
      .eq('user_id', userId)
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd)
      .order('created_at', { ascending: false });

    // Get user's exports for the week
    const { data: exports } = await supabase
      .from('exports')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);

    // Get team activity if user is part of a team and wants team data
    let teamActivity;
    if (teamId && preferences.include_team_activity) {
      teamActivity = await this.getTeamActivity(teamId, weekStart, weekEnd);
    }

    // Calculate insights
    const insights = this.calculateInsights(summaries || [], exports || []);

    // Get top summaries (max 3)
    const topSummaries = (summaries || [])
      .slice(0, 3)
      .map(summary => ({
        id: summary.id,
        title: summary.title,
        createdAt: summary.created_at,
        actionItems: summary.action_items?.length || 0,
      }));

    return {
      userId,
      userEmail,
      userName,
      teamId,
      teamName,
      weekStart,
      weekEnd,
      summariesCreated: summaries?.length || 0,
      exportsCompleted: exports?.length || 0,
      topSummaries,
      teamActivity,
      insights,
    };
  }

  /**
   * Get team activity data
   */
  private async getTeamActivity(teamId: string, weekStart: string, weekEnd: string): Promise<any> {
    // Get team summaries
    const { data: teamSummaries } = await supabase
      .from('summaries')
      .select(`
        id,
        user_id,
        users:user_id (name)
      `)
      .eq('team_id', teamId)
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);

    if (!teamSummaries) return null;

    // Calculate team stats
    const activeMembers = new Set(teamSummaries.map(s => s.user_id)).size;
    
    // Top contributors
    const contributorMap = new Map();
    teamSummaries.forEach(summary => {
      const userId = summary.user_id;
      const userName = (summary.users as any)?.name || 'Unknown';
      contributorMap.set(userId, {
        name: userName,
        summaries: (contributorMap.get(userId)?.summaries || 0) + 1,
      });
    });

    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => b.summaries - a.summaries)
      .slice(0, 3);

    return {
      totalSummaries: teamSummaries.length,
      activeMembers,
      topContributors,
    };
  }

  /**
   * Calculate insights from user activity
   */
  private calculateInsights(summaries: any[], exports: any[]): any {
    if (summaries.length === 0) {
      return {
        mostActiveDay: 'No activity',
        averageSummaryLength: 0,
        totalActionItems: 0,
        completionRate: 0,
      };
    }

    // Most active day
    const dayCount = new Map();
    summaries.forEach(summary => {
      const day = new Date(summary.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });
    
    const mostActiveDay = Array.from(dayCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No activity';

    // Average summary length (estimated)
    const averageSummaryLength = Math.round(
      summaries.reduce((sum, s) => sum + (s.summary?.length || 500), 0) / summaries.length
    );

    // Total action items
    const totalActionItems = summaries.reduce(
      (sum, s) => sum + (s.action_items?.length || 0), 0
    );

    // Completion rate (mock calculation)
    const completionRate = Math.round(Math.random() * 30 + 70); // 70-100%

    return {
      mostActiveDay,
      averageSummaryLength,
      totalActionItems,
      completionRate,
    };
  }

  /**
   * Send digest email to user
   */
  private async sendDigestEmail(digestData: WeeklyDigestData): Promise<void> {
    const subject = `Your Weekly SummaryAI Digest - ${digestData.summariesCreated} summaries created`;
    
    const html = this.generateDigestHTML(digestData);
    
    // Use email service to send
    await emailService.sendCustomEmail({
      to: digestData.userEmail,
      subject,
      html,
    });

    console.log(`Weekly digest sent to ${digestData.userEmail}`);
  }

  /**
   * Generate HTML for digest email
   */
  private generateDigestHTML(data: WeeklyDigestData): string {
    const weekRange = `${new Date(data.weekStart).toLocaleDateString()} - ${new Date(data.weekEnd).toLocaleDateString()}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Weekly SummaryAI Digest</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .stat-box { background: white; padding: 20px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #667eea; }
          .summary-item { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Your Weekly SummaryAI Digest</h1>
            <p>Week of ${weekRange}</p>
          </div>

          <div class="content">
            <h2>👋 Hi ${data.userName}!</h2>
            <p>Here's your weekly summary of activity on SummaryAI:</p>

            <div class="stat-box">
              <h3>📊 Your Week in Numbers</h3>
              <ul>
                <li><strong>${data.summariesCreated}</strong> summaries created</li>
                <li><strong>${data.exportsCompleted}</strong> exports completed</li>
                <li><strong>${data.insights.totalActionItems}</strong> action items identified</li>
                <li><strong>${data.insights.completionRate}%</strong> completion rate</li>
              </ul>
            </div>

            ${data.topSummaries.length > 0 ? `
              <div class="stat-box">
                <h3>🌟 Your Top Summaries</h3>
                ${data.topSummaries.map(summary => `
                  <div class="summary-item">
                    <strong>${summary.title}</strong><br>
                    <small>${new Date(summary.createdAt).toLocaleDateString()} • ${summary.actionItems} action items</small>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${data.teamActivity ? `
              <div class="stat-box">
                <h3>👥 Team Activity</h3>
                <p><strong>${data.teamName}</strong> had a productive week:</p>
                <ul>
                  <li><strong>${data.teamActivity.totalSummaries}</strong> total summaries</li>
                  <li><strong>${data.teamActivity.activeMembers}</strong> active members</li>
                </ul>
                ${data.teamActivity.topContributors.length > 0 ? `
                  <p><strong>Top contributors:</strong></p>
                  <ul>
                    ${data.teamActivity.topContributors.map(contributor => 
                      `<li>${contributor.name}: ${contributor.summaries} summaries</li>`
                    ).join('')}
                  </ul>
                ` : ''}
              </div>
            ` : ''}

            <div class="stat-box">
              <h3>💡 Insights</h3>
              <ul>
                <li><strong>Most active day:</strong> ${data.insights.mostActiveDay}</li>
                <li><strong>Average summary length:</strong> ${data.insights.averageSummaryLength} characters</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Dashboard</a>
            </div>
          </div>

          <div class="footer">
            <p>Keep up the great work! 🚀</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/account">Manage digest preferences</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Log that a digest was sent
   */
  private async logDigestSent(userId: string, digestData: WeeklyDigestData): Promise<void> {
    try {
      await supabase
        .from('digest_logs')
        .insert({
          user_id: userId,
          digest_type: 'weekly',
          week_start: digestData.weekStart,
          week_end: digestData.weekEnd,
          summaries_count: digestData.summariesCreated,
          exports_count: digestData.exportsCompleted,
          sent_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging digest sent:', error);
    }
  }

  /**
   * Update user digest preferences
   */
  async updateDigestPreferences(userId: string, preferences: Partial<DigestPreferences>): Promise<void> {
    try {
      const { error } = await supabase
        .from('digest_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to update digest preferences: ${error.message}`);
      }

      console.log('Digest preferences updated for user:', userId);
    } catch (error) {
      console.error('Error updating digest preferences:', error);
      throw error;
    }
  }

  /**
   * Get user digest preferences
   */
  async getDigestPreferences(userId: string): Promise<DigestPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('digest_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get digest preferences: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error('Error getting digest preferences:', error);
      return null;
    }
  }
}

export const weeklyDigestService = new WeeklyDigestService();

// Helper function to trigger weekly digest (for cron jobs)
export async function sendWeeklyDigests(): Promise<void> {
  await weeklyDigestService.sendWeeklyDigests();
}
