/**
 * Team AI Coach - Behavioral Coaching Assistant
 * Analyzes user patterns and provides personalized coaching suggestions
 */

export interface CoachingPattern {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'engagement' | 'collaboration' | 'decision_making' | 'follow_through';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionRules: {
    timeframe: number; // days
    threshold: number;
    conditions: string[];
  };
  suggestion: {
    title: string;
    message: string;
    actionText?: string;
    actionUrl?: string;
  };
  isActive: boolean;
}

export interface BehaviorAnalysis {
  userId: string;
  analysisDate: string;
  timeframe: number; // days analyzed
  metrics: {
    totalMeetings: number;
    decisionsPerMeeting: number;
    actionItemsPerMeeting: number;
    followUpRate: number;
    engagementScore: number;
    collaborationScore: number;
  };
  detectedPatterns: DetectedPattern[];
  overallScore: number;
  recommendations: CoachingRecommendation[];
}

export interface DetectedPattern {
  patternId: string;
  confidence: number;
  evidence: string[];
  firstDetected: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface CoachingRecommendation {
  id: string;
  type: 'immediate' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expectedImpact: string;
  actionSteps: string[];
  resources?: string[];
  trackingMetric?: string;
}

export interface CoachingDigest {
  userId: string;
  weekStart: string;
  weekEnd: string;
  summary: {
    improvementAreas: string[];
    achievements: string[];
    keyMetrics: Record<string, number>;
  };
  recommendations: CoachingRecommendation[];
  nextWeekFocus: string[];
}

export class AICoachEngine {
  private static readonly COACHING_PATTERNS: CoachingPattern[] = [
    {
      id: 'low_action_items',
      name: 'Low Action Item Generation',
      description: 'User consistently has meetings without clear action items',
      category: 'productivity',
      severity: 'medium',
      detectionRules: {
        timeframe: 14,
        threshold: 3,
        conditions: ['meetings_without_actions >= 3', 'action_items_per_meeting < 0.5']
      },
      suggestion: {
        title: 'Try adding clearer action items',
        message: 'Your recent meetings had few action items. Consider ending meetings with "What are our next steps?" to drive accountability.',
        actionText: 'Learn More',
        actionUrl: '/help/action-items'
      },
      isActive: true
    },
    {
      id: 'repetitive_summaries',
      name: 'Repetitive Summary Content',
      description: 'User creates very similar summaries repeatedly',
      category: 'engagement',
      severity: 'low',
      detectionRules: {
        timeframe: 7,
        threshold: 0.8,
        conditions: ['content_similarity > 0.8', 'summary_count >= 3']
      },
      suggestion: {
        title: 'Mix up your meeting formats',
        message: 'Your summaries seem similar lately. Try different meeting types like brainstorming or retrospectives for variety.',
        actionText: 'Explore Templates',
        actionUrl: '/templates'
      },
      isActive: true
    },
    {
      id: 'low_decision_density',
      name: 'Low Decision Making',
      description: 'Meetings lack clear decisions or conclusions',
      category: 'decision_making',
      severity: 'high',
      detectionRules: {
        timeframe: 21,
        threshold: 5,
        conditions: ['meetings_without_decisions >= 5', 'decision_keywords_count < 2']
      },
      suggestion: {
        title: 'Focus on decision-making',
        message: 'Many recent meetings lacked clear decisions. Try using decision frameworks like "What will we decide today?"',
        actionText: 'Decision Templates',
        actionUrl: '/help/decisions'
      },
      isActive: true
    },
    {
      id: 'poor_follow_up',
      name: 'Poor Follow-up Rate',
      description: 'User rarely follows up on action items or decisions',
      category: 'follow_through',
      severity: 'high',
      detectionRules: {
        timeframe: 30,
        threshold: 0.3,
        conditions: ['follow_up_rate < 0.3', 'action_items_count > 10']
      },
      suggestion: {
        title: 'Improve follow-up consistency',
        message: 'Only 30% of your action items get followed up. Set calendar reminders or use our auto-follow-up feature.',
        actionText: 'Enable Auto-Follow-up',
        actionUrl: '/automation/followup'
      },
      isActive: true
    },
    {
      id: 'low_collaboration',
      name: 'Low Team Collaboration',
      description: 'User rarely involves team members or shares summaries',
      category: 'collaboration',
      severity: 'medium',
      detectionRules: {
        timeframe: 14,
        threshold: 0.2,
        conditions: ['team_sharing_rate < 0.2', 'solo_meetings_ratio > 0.8']
      },
      suggestion: {
        title: 'Increase team collaboration',
        message: 'Most of your meetings are solo. Consider inviting team members or sharing summaries for better alignment.',
        actionText: 'Invite Team',
        actionUrl: '/team/invite'
      },
      isActive: true
    },
    {
      id: 'meeting_overload',
      name: 'Meeting Overload',
      description: 'User has too many meetings without sufficient breaks',
      category: 'productivity',
      severity: 'critical',
      detectionRules: {
        timeframe: 7,
        threshold: 25,
        conditions: ['meetings_per_week > 25', 'average_meeting_length > 60']
      },
      suggestion: {
        title: 'Consider meeting hygiene',
        message: 'You had 25+ meetings this week. Consider shorter meetings, async updates, or meeting-free blocks.',
        actionText: 'Meeting Best Practices',
        actionUrl: '/help/meeting-hygiene'
      },
      isActive: true
    }
  ];

  /**
   * Analyze user behavior patterns
   */
  static async analyzeBehaviorPatterns(userId: string, timeframeDays: number = 14): Promise<BehaviorAnalysis> {
    try {
      // Get user's summary data for analysis
      const summaryData = await this.getUserSummaryData(userId, timeframeDays);
      
      // Calculate behavioral metrics
      const metrics = this.calculateBehaviorMetrics(summaryData);
      
      // Detect patterns
      const detectedPatterns = await this.detectPatterns(summaryData, metrics);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(detectedPatterns, metrics);
      
      // Calculate overall behavior score
      const overallScore = this.calculateOverallScore(metrics, detectedPatterns);
      
      return {
        userId,
        analysisDate: new Date().toISOString(),
        timeframe: timeframeDays,
        metrics,
        detectedPatterns,
        overallScore,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing behavior patterns:', error);
      throw error;
    }
  }

  /**
   * Generate weekly coaching digest
   */
  static async generateWeeklyDigest(userId: string): Promise<CoachingDigest> {
    try {
      const weekStart = this.getWeekStart();
      const weekEnd = this.getWeekEnd();
      
      // Analyze behavior for the week
      const analysis = await this.analyzeBehaviorPatterns(userId, 7);
      
      // Generate summary insights
      const summary = this.generateWeeklySummary(analysis);
      
      // Filter recommendations for weekly digest
      const weeklyRecommendations = analysis.recommendations.filter(r => 
        r.type === 'weekly' || r.priority === 'high' || r.priority === 'urgent'
      );
      
      // Generate next week focus areas
      const nextWeekFocus = this.generateNextWeekFocus(analysis);
      
      return {
        userId,
        weekStart,
        weekEnd,
        summary,
        recommendations: weeklyRecommendations,
        nextWeekFocus
      };
    } catch (error) {
      console.error('Error generating weekly digest:', error);
      throw error;
    }
  }

  /**
   * Get coaching suggestions for immediate display
   */
  static async getImmediateSuggestions(userId: string): Promise<CoachingRecommendation[]> {
    try {
      const analysis = await this.analyzeBehaviorPatterns(userId, 7);
      
      return analysis.recommendations.filter(r => 
        r.type === 'immediate' && (r.priority === 'high' || r.priority === 'urgent')
      ).slice(0, 3); // Show max 3 immediate suggestions
    } catch (error) {
      console.error('Error getting immediate suggestions:', error);
      return [];
    }
  }

  /**
   * Track coaching interaction
   */
  static async trackCoachingInteraction(data: {
    userId: string;
    recommendationId: string;
    action: 'viewed' | 'dismissed' | 'acted_on';
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      const interaction = {
        id: `coaching_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId: data.userId,
        recommendationId: data.recommendationId,
        action: data.action,
        timestamp: new Date().toISOString(),
        context: data.context || {}
      };

      // Store interaction
      await this.storeCoachingInteraction(interaction);

      // Track in analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'coaching_interaction', {
          recommendation_id: data.recommendationId,
          action: data.action,
          user_id: data.userId
        });
      }
    } catch (error) {
      console.error('Error tracking coaching interaction:', error);
    }
  }

  // Private helper methods
  private static async getUserSummaryData(userId: string, days: number): Promise<any> {
    // Mock data - in production, query from database
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    return {
      summaries: [
        {
          id: 'summary_1',
          content: 'Team standup meeting. Discussed progress on current sprint.',
          date: '2024-06-24',
          actionItems: [],
          decisions: [],
          participants: ['user'],
          duration: 30
        },
        {
          id: 'summary_2',
          content: 'Product planning session. Reviewed roadmap for Q4.',
          date: '2024-06-23',
          actionItems: ['Create technical spec', 'Schedule user interviews'],
          decisions: ['Prioritize API integration'],
          participants: ['user', 'john', 'sarah'],
          duration: 60
        },
        {
          id: 'summary_3',
          content: 'Daily standup. Team updates on current tasks.',
          date: '2024-06-22',
          actionItems: [],
          decisions: [],
          participants: ['user'],
          duration: 15
        }
      ],
      timeframe: { start: startDate.toISOString(), end: endDate.toISOString() }
    };
  }

  private static calculateBehaviorMetrics(summaryData: any): any {
    const summaries = summaryData.summaries;
    const totalMeetings = summaries.length;
    
    const totalActionItems = summaries.reduce((sum: number, s: any) => sum + s.actionItems.length, 0);
    const totalDecisions = summaries.reduce((sum: number, s: any) => sum + s.decisions.length, 0);
    const meetingsWithFollowUp = summaries.filter((s: any) => s.actionItems.length > 0).length;
    const collaborativeMeetings = summaries.filter((s: any) => s.participants.length > 1).length;
    
    return {
      totalMeetings,
      decisionsPerMeeting: totalMeetings > 0 ? totalDecisions / totalMeetings : 0,
      actionItemsPerMeeting: totalMeetings > 0 ? totalActionItems / totalMeetings : 0,
      followUpRate: totalMeetings > 0 ? meetingsWithFollowUp / totalMeetings : 0,
      engagementScore: this.calculateEngagementScore(summaries),
      collaborationScore: totalMeetings > 0 ? collaborativeMeetings / totalMeetings : 0
    };
  }

  private static async detectPatterns(summaryData: any, metrics: any): Promise<DetectedPattern[]> {
    const detectedPatterns: DetectedPattern[] = [];
    
    for (const pattern of this.COACHING_PATTERNS) {
      if (!pattern.isActive) continue;
      
      const isDetected = this.evaluatePatternConditions(pattern, summaryData, metrics);
      
      if (isDetected) {
        detectedPatterns.push({
          patternId: pattern.id,
          confidence: 0.8, // Mock confidence
          evidence: this.generateEvidence(pattern, summaryData, metrics),
          firstDetected: new Date().toISOString(),
          frequency: 1,
          impact: pattern.severity === 'critical' || pattern.severity === 'high' ? 'negative' : 'neutral'
        });
      }
    }
    
    return detectedPatterns;
  }

  private static evaluatePatternConditions(pattern: CoachingPattern, summaryData: any, metrics: any): boolean {
    const summaries = summaryData.summaries;
    
    switch (pattern.id) {
      case 'low_action_items':
        const meetingsWithoutActions = summaries.filter((s: any) => s.actionItems.length === 0).length;
        return meetingsWithoutActions >= 3 && metrics.actionItemsPerMeeting < 0.5;
        
      case 'low_decision_density':
        const meetingsWithoutDecisions = summaries.filter((s: any) => s.decisions.length === 0).length;
        return meetingsWithoutDecisions >= 3;
        
      case 'poor_follow_up':
        return metrics.followUpRate < 0.3 && summaries.length > 5;
        
      case 'low_collaboration':
        return metrics.collaborationScore < 0.2;
        
      case 'meeting_overload':
        return summaries.length > 15; // More than 15 meetings in timeframe
        
      default:
        return false;
    }
  }

  private static generateEvidence(pattern: CoachingPattern, summaryData: any, metrics: any): string[] {
    const evidence: string[] = [];
    
    switch (pattern.id) {
      case 'low_action_items':
        evidence.push(`${Math.round(metrics.actionItemsPerMeeting * 10) / 10} action items per meeting`);
        evidence.push(`${summaryData.summaries.filter((s: any) => s.actionItems.length === 0).length} meetings without action items`);
        break;
        
      case 'low_decision_density':
        evidence.push(`${Math.round(metrics.decisionsPerMeeting * 10) / 10} decisions per meeting`);
        evidence.push(`${summaryData.summaries.filter((s: any) => s.decisions.length === 0).length} meetings without decisions`);
        break;
        
      case 'low_collaboration':
        evidence.push(`${Math.round(metrics.collaborationScore * 100)}% collaborative meetings`);
        break;
    }
    
    return evidence;
  }

  private static generateRecommendations(patterns: DetectedPattern[], metrics: any): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    patterns.forEach(pattern => {
      const patternConfig = this.COACHING_PATTERNS.find(p => p.id === pattern.patternId);
      if (!patternConfig) return;
      
      recommendations.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        type: pattern.impact === 'negative' ? 'immediate' : 'weekly',
        priority: patternConfig.severity === 'critical' ? 'urgent' : 
                 patternConfig.severity === 'high' ? 'high' : 'medium',
        title: patternConfig.suggestion.title,
        description: patternConfig.suggestion.message,
        expectedImpact: this.getExpectedImpact(patternConfig),
        actionSteps: this.getActionSteps(patternConfig),
        resources: patternConfig.suggestion.actionUrl ? [patternConfig.suggestion.actionUrl] : undefined,
        trackingMetric: this.getTrackingMetric(patternConfig)
      });
    });
    
    return recommendations;
  }

  private static calculateOverallScore(metrics: any, patterns: DetectedPattern[]): number {
    let score = 100;
    
    // Deduct points for negative patterns
    patterns.forEach(pattern => {
      if (pattern.impact === 'negative') {
        const patternConfig = this.COACHING_PATTERNS.find(p => p.id === pattern.patternId);
        if (patternConfig) {
          switch (patternConfig.severity) {
            case 'critical': score -= 25; break;
            case 'high': score -= 15; break;
            case 'medium': score -= 10; break;
            case 'low': score -= 5; break;
          }
        }
      }
    });
    
    // Bonus points for good metrics
    if (metrics.actionItemsPerMeeting > 2) score += 5;
    if (metrics.decisionsPerMeeting > 1) score += 5;
    if (metrics.collaborationScore > 0.7) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private static calculateEngagementScore(summaries: any[]): number {
    // Simple engagement calculation based on content length and variety
    const avgContentLength = summaries.reduce((sum, s) => sum + s.content.length, 0) / summaries.length;
    const contentVariety = new Set(summaries.map(s => s.content.substring(0, 50))).size / summaries.length;
    
    return Math.min(1, (avgContentLength / 200) * 0.5 + contentVariety * 0.5);
  }

  private static generateWeeklySummary(analysis: BehaviorAnalysis): any {
    const improvementAreas: string[] = [];
    const achievements: string[] = [];
    
    // Identify improvement areas from patterns
    analysis.detectedPatterns.forEach(pattern => {
      const patternConfig = this.COACHING_PATTERNS.find(p => p.id === pattern.patternId);
      if (patternConfig && pattern.impact === 'negative') {
        improvementAreas.push(patternConfig.name);
      }
    });
    
    // Identify achievements from good metrics
    if (analysis.metrics.actionItemsPerMeeting > 2) {
      achievements.push('Strong action item generation');
    }
    if (analysis.metrics.collaborationScore > 0.7) {
      achievements.push('Excellent team collaboration');
    }
    if (analysis.overallScore > 80) {
      achievements.push('High overall productivity score');
    }
    
    return {
      improvementAreas,
      achievements,
      keyMetrics: {
        'Meetings This Week': analysis.metrics.totalMeetings,
        'Action Items per Meeting': Math.round(analysis.metrics.actionItemsPerMeeting * 10) / 10,
        'Collaboration Score': Math.round(analysis.metrics.collaborationScore * 100),
        'Overall Score': analysis.overallScore
      }
    };
  }

  private static generateNextWeekFocus(analysis: BehaviorAnalysis): string[] {
    const focus: string[] = [];
    
    // Generate focus areas based on detected patterns
    analysis.detectedPatterns.forEach(pattern => {
      switch (pattern.patternId) {
        case 'low_action_items':
          focus.push('End meetings with clear next steps');
          break;
        case 'low_decision_density':
          focus.push('Use decision frameworks in meetings');
          break;
        case 'low_collaboration':
          focus.push('Invite more team members to meetings');
          break;
      }
    });
    
    // Add general improvement suggestions
    if (analysis.overallScore < 70) {
      focus.push('Focus on meeting effectiveness');
    }
    
    return focus.slice(0, 3); // Max 3 focus areas
  }

  private static getExpectedImpact(pattern: CoachingPattern): string {
    switch (pattern.category) {
      case 'productivity':
        return 'Improve meeting efficiency and output quality';
      case 'collaboration':
        return 'Enhance team alignment and communication';
      case 'decision_making':
        return 'Accelerate decision-making and reduce ambiguity';
      case 'follow_through':
        return 'Increase accountability and task completion';
      default:
        return 'Improve overall meeting effectiveness';
    }
  }

  private static getActionSteps(pattern: CoachingPattern): string[] {
    switch (pattern.id) {
      case 'low_action_items':
        return [
          'End each meeting by asking "What are our next steps?"',
          'Assign specific owners to each action item',
          'Set clear deadlines for follow-up tasks'
        ];
      case 'low_decision_density':
        return [
          'Start meetings with "What decisions do we need to make?"',
          'Use decision frameworks like RACI or DACI',
          'Document decisions clearly in summaries'
        ];
      case 'low_collaboration':
        return [
          'Invite relevant team members to meetings',
          'Share summaries with broader team',
          'Schedule regular team check-ins'
        ];
      default:
        return ['Review meeting best practices', 'Implement suggested improvements'];
    }
  }

  private static getTrackingMetric(pattern: CoachingPattern): string {
    switch (pattern.category) {
      case 'productivity':
        return 'action_items_per_meeting';
      case 'collaboration':
        return 'collaboration_score';
      case 'decision_making':
        return 'decisions_per_meeting';
      case 'follow_through':
        return 'follow_up_rate';
      default:
        return 'overall_score';
    }
  }

  private static getWeekStart(): string {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return startOfWeek.toISOString().split('T')[0];
  }

  private static getWeekEnd(): string {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6);
    return endOfWeek.toISOString().split('T')[0];
  }

  private static async storeCoachingInteraction(interaction: any): Promise<void> {
    // Store in Supabase
    console.log('Storing coaching interaction:', interaction);
  }
}
