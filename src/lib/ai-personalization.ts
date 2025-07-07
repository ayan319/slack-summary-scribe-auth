/**
 * AI Personalization & Prompt Templates System
 * Provides custom summary styles, tone control, and personalization options
 */

export interface SummaryStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  template: string;
  example: string;
  isPro?: boolean;
}

export interface ToneOption {
  id: string;
  name: string;
  description: string;
  modifier: string;
  example: string;
}

export interface PersonalizationSettings {
  style: string;
  tone: string;
  focusAreas: string[];
  customInstructions?: string;
  includeConfidence: boolean;
  includeTimestamps: boolean;
  maxLength: 'short' | 'medium' | 'long';
  language: string;
}

export class AIPersonalizationService {
  // Summary Style Presets
  static readonly SUMMARY_STYLES: SummaryStyle[] = [
    {
      id: 'bullet_points',
      name: 'Bullet Points',
      description: 'Clean, scannable bullet points for quick reading',
      icon: '📋',
      template: `
Create a summary using clear bullet points organized by:
• Key Points: Main topics discussed
• Decisions Made: Concrete decisions reached
• Action Items: Tasks assigned with owners
• Next Steps: Follow-up actions needed

Format each section with bullet points for easy scanning.
      `,
      example: '• Decision: Launch new feature next month\n• Action: Sarah to create wireframes by Friday\n• Next: Review session scheduled for Monday'
    },
    {
      id: 'paragraph',
      name: 'Paragraph Format',
      description: 'Flowing narrative style for detailed context',
      icon: '📄',
      template: `
Create a comprehensive summary in paragraph format that flows naturally.
Start with an overview, then detail the key discussions, decisions made,
and conclude with action items and next steps. Maintain narrative flow
while ensuring all important information is captured.
      `,
      example: 'The team discussed the upcoming product launch, ultimately deciding to move forward with the proposed timeline. Sarah will create wireframes by Friday, and the team will reconvene Monday for review.'
    },
    {
      id: 'action_focused',
      name: 'Action-Focused',
      description: 'Emphasizes tasks, owners, and deadlines',
      icon: '⚡',
      template: `
Create a summary that prioritizes actionable items:
1. Immediate Actions (this week)
2. Short-term Actions (next 2 weeks)
3. Long-term Actions (next month+)

For each action, include:
- What needs to be done
- Who is responsible
- When it's due
- Any dependencies

Include context only when necessary for understanding the actions.
      `,
      example: 'IMMEDIATE: Sarah creates wireframes (Due: Friday)\nSHORT-TERM: Team review session (Due: Monday)\nLONG-TERM: Feature launch (Due: Next month)',
      isPro: true
    },
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for leadership',
      icon: '👔',
      template: `
Create an executive-level summary focusing on:
- Strategic decisions and their business impact
- Resource allocation and budget implications
- Timeline and milestone commitments
- Risk factors and mitigation strategies
- Key metrics and success criteria

Keep technical details minimal and focus on business outcomes.
      `,
      example: 'Strategic Decision: Accelerate product launch to capture Q4 market opportunity. Resource Impact: Requires 2 additional developers. Timeline: 6-week delivery commitment. Risk: Tight deadline may impact quality.',
      isPro: true
    },
    {
      id: 'technical',
      name: 'Technical Deep-dive',
      description: 'Detailed technical information for engineers',
      icon: '⚙️',
      template: `
Create a technical summary including:
- Technical decisions and architecture choices
- Implementation details and specifications
- Code review outcomes and technical debt
- Performance considerations and optimizations
- Integration requirements and dependencies
- Testing strategies and quality assurance

Maintain technical accuracy and include relevant code snippets or technical terms.
      `,
      example: 'Technical Decision: Implement Redis caching layer for 50% performance improvement. Architecture: Microservices with API Gateway. Dependencies: Requires Docker containerization. Testing: Unit tests + integration tests required.',
      isPro: true
    },
    {
      id: 'meeting_minutes',
      name: 'Meeting Minutes',
      description: 'Formal meeting documentation style',
      icon: '📝',
      template: `
Create formal meeting minutes with:
- Meeting details (date, time, attendees)
- Agenda items discussed
- Decisions reached with voting results if applicable
- Action items with assigned owners and due dates
- Next meeting date and agenda preview

Use formal language appropriate for official documentation.
      `,
      example: 'Meeting: Product Planning Session\nAttendees: Sarah (PM), Mike (Dev), Lisa (Design)\nDecision: Approved feature roadmap (3-0 vote)\nAction Items: Sarah - Requirements doc (Due: Friday)\nNext Meeting: Monday 2PM - Design review',
      isPro: true
    }
  ];

  // Tone Options
  static readonly TONE_OPTIONS: ToneOption[] = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Formal, business-appropriate language',
      modifier: 'Use professional, formal language appropriate for business communication.',
      example: 'The team reached a consensus to proceed with the proposed implementation strategy.'
    },
    {
      id: 'casual',
      name: 'Casual',
      description: 'Friendly, conversational tone',
      modifier: 'Use casual, friendly language as if talking to a colleague.',
      example: 'The team decided to go with the new approach - everyone was on board!'
    },
    {
      id: 'concise',
      name: 'Concise',
      description: 'Brief, to-the-point communication',
      modifier: 'Be extremely concise and direct. Use minimal words while maintaining clarity.',
      example: 'Decision: New approach approved. Action: Start implementation Monday.'
    },
    {
      id: 'detailed',
      name: 'Detailed',
      description: 'Comprehensive with full context',
      modifier: 'Provide comprehensive details and full context for each point discussed.',
      example: 'After extensive discussion of the pros and cons, including consideration of timeline constraints and resource availability, the team unanimously decided to proceed with the new implementation approach, which will require additional development resources but promises better long-term maintainability.'
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Technical terminology and precision',
      modifier: 'Use precise technical terminology and focus on technical accuracy.',
      example: 'Architectural decision: Implement microservices pattern with API Gateway for improved scalability and maintainability.'
    }
  ];

  // Focus Areas
  static readonly FOCUS_AREAS = [
    { id: 'decisions', name: 'Decisions Made', description: 'Emphasize concrete decisions reached' },
    { id: 'actions', name: 'Action Items', description: 'Highlight tasks and assignments' },
    { id: 'deadlines', name: 'Deadlines & Timelines', description: 'Focus on dates and schedules' },
    { id: 'people', name: 'People & Roles', description: 'Emphasize who is responsible for what' },
    { id: 'risks', name: 'Risks & Blockers', description: 'Identify potential issues and obstacles' },
    { id: 'metrics', name: 'Metrics & KPIs', description: 'Highlight numbers and measurements' },
    { id: 'budget', name: 'Budget & Resources', description: 'Focus on financial and resource implications' },
    { id: 'technical', name: 'Technical Details', description: 'Emphasize technical specifications and requirements' }
  ];

  /**
   * Generate personalized prompt based on user settings
   */
  static generatePersonalizedPrompt(
    content: string,
    settings: PersonalizationSettings
  ): string {
    const style = this.SUMMARY_STYLES.find(s => s.id === settings.style);
    const tone = this.TONE_OPTIONS.find(t => t.id === settings.tone);
    
    if (!style || !tone) {
      throw new Error('Invalid style or tone selection');
    }

    const prompt = `You are an expert conversation analyst. Analyze the following conversation and create a summary.

STYLE INSTRUCTIONS:
${style.template}

TONE INSTRUCTIONS:
${tone.modifier}

FOCUS AREAS:
${settings.focusAreas.map(area => {
  const focusArea = this.FOCUS_AREAS.find(f => f.id === area);
  return focusArea ? `- ${focusArea.name}: ${focusArea.description}` : '';
}).filter(Boolean).join('\n')}

FORMATTING REQUIREMENTS:
- Maximum length: ${settings.maxLength}
- Include confidence indicators: ${settings.includeConfidence ? 'Yes' : 'No'}
- Include timestamps: ${settings.includeTimestamps ? 'Yes' : 'No'}
- Language: ${settings.language}

${settings.customInstructions ? `CUSTOM INSTRUCTIONS:\n${settings.customInstructions}\n` : ''}

CONVERSATION TO ANALYZE:
${content}

Please provide a summary following the above specifications.`;

    return prompt;
  }

  /**
   * Get available styles for user's plan
   */
  static getAvailableStyles(isPro: boolean): SummaryStyle[] {
    return this.SUMMARY_STYLES.filter(style => !style.isPro || isPro);
  }

  /**
   * Validate personalization settings
   */
  static validateSettings(settings: PersonalizationSettings): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if style exists
    if (!this.SUMMARY_STYLES.find(s => s.id === settings.style)) {
      errors.push('Invalid summary style selected');
    }

    // Check if tone exists
    if (!this.TONE_OPTIONS.find(t => t.id === settings.tone)) {
      errors.push('Invalid tone option selected');
    }

    // Check focus areas
    const invalidFocusAreas = settings.focusAreas.filter(
      area => !this.FOCUS_AREAS.find(f => f.id === area)
    );
    if (invalidFocusAreas.length > 0) {
      errors.push(`Invalid focus areas: ${invalidFocusAreas.join(', ')}`);
    }

    // Check custom instructions length
    if (settings.customInstructions && settings.customInstructions.length > 500) {
      errors.push('Custom instructions must be under 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default settings for new users
   */
  static getDefaultSettings(): PersonalizationSettings {
    return {
      style: 'bullet_points',
      tone: 'professional',
      focusAreas: ['decisions', 'actions'],
      includeConfidence: true,
      includeTimestamps: false,
      maxLength: 'medium',
      language: 'English'
    };
  }

  /**
   * Create custom template
   */
  static createCustomTemplate(
    name: string,
    description: string,
    template: string,
    userId: string
  ): SummaryStyle {
    return {
      id: `custom_${Date.now()}_${userId.slice(-4)}`,
      name,
      description,
      icon: '🎨',
      template,
      example: 'Custom template - example will be generated based on usage',
      isPro: true
    };
  }

  /**
   * Get style recommendations based on conversation type
   */
  static getStyleRecommendations(conversationType: string): string[] {
    const recommendations: Record<string, string[]> = {
      'standup': ['bullet_points', 'action_focused'],
      'planning': ['executive', 'meeting_minutes'],
      'technical': ['technical', 'bullet_points'],
      'brainstorming': ['paragraph', 'bullet_points'],
      'review': ['technical', 'action_focused'],
      'client': ['executive', 'professional'],
      'team': ['casual', 'action_focused']
    };

    return recommendations[conversationType] || ['bullet_points', 'professional'];
  }

  /**
   * Analyze conversation and suggest optimal settings
   */
  static suggestOptimalSettings(content: string): Partial<PersonalizationSettings> {
    const suggestions: Partial<PersonalizationSettings> = {};

    // Analyze content for style suggestions
    const hasActionItems = /action|task|todo|assign|responsible|due|deadline/i.test(content);
    const hasTechnicalTerms = /api|database|code|deploy|bug|feature|implementation/i.test(content);
    const hasDecisions = /decide|decision|agree|approve|consensus|vote/i.test(content);
    const hasMetrics = /\d+%|\$\d+|metric|kpi|performance|revenue/i.test(content);

    // Suggest style based on content
    if (hasActionItems && hasDecisions) {
      suggestions.style = 'action_focused';
    } else if (hasTechnicalTerms) {
      suggestions.style = 'technical';
    } else if (hasMetrics) {
      suggestions.style = 'executive';
    } else {
      suggestions.style = 'bullet_points';
    }

    // Suggest focus areas
    const focusAreas: string[] = [];
    if (hasDecisions) focusAreas.push('decisions');
    if (hasActionItems) focusAreas.push('actions');
    if (hasTechnicalTerms) focusAreas.push('technical');
    if (hasMetrics) focusAreas.push('metrics');
    
    suggestions.focusAreas = focusAreas.length > 0 ? focusAreas : ['decisions', 'actions'];

    // Suggest tone based on formality
    const isFormal = /please|kindly|regards|sincerely|meeting|agenda/i.test(content);
    suggestions.tone = isFormal ? 'professional' : 'casual';

    return suggestions;
  }
}
