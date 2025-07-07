/**
 * Meeting Auto-Followups System
 * Generate and send action items, tasks, and follow-ups from summaries
 */

export interface ActionItem {
  id: string;
  summaryId: string;
  title: string;
  description: string;
  assignee?: {
    name: string;
    email: string;
    slackId?: string;
  };
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  createdAt: string;
  completedAt?: string;
  estimatedHours?: number;
  dependencies?: string[];
}

export interface FollowupTemplate {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'task_manager';
  subject: string;
  content: string;
  recipients: 'all_participants' | 'assignees_only' | 'custom';
  timing: 'immediate' | 'end_of_day' | 'next_morning' | 'custom';
  isActive: boolean;
}

export interface FollowupResult {
  actionItems: ActionItem[];
  emailsSent: number;
  slackMessagesSent: number;
  tasksCreated: number;
  errors: string[];
}

export interface MeetingContext {
  summaryId: string;
  title: string;
  content: string;
  participants: Array<{
    name: string;
    email: string;
    slackId?: string;
    role?: string;
  }>;
  date: string;
  duration?: number;
  meetingType?: string;
}

export class AutoFollowupEngine {
  private static readonly FOLLOWUP_TEMPLATES: FollowupTemplate[] = [
    {
      id: 'standard_email',
      name: 'Standard Email Follow-up',
      type: 'email',
      subject: 'Action Items from {{meetingTitle}} - {{date}}',
      content: `Hi team,

Here's a summary of our meeting and the action items we discussed:

**Meeting Summary:**
{{summary}}

**Action Items:**
{{actionItems}}

**Next Steps:**
{{nextSteps}}

Please let me know if you have any questions or if I missed anything.

Best regards,
{{senderName}}`,
      recipients: 'all_participants',
      timing: 'immediate',
      isActive: true
    },
    {
      id: 'slack_summary',
      name: 'Slack Channel Summary',
      type: 'slack',
      subject: 'Meeting Summary: {{meetingTitle}}',
      content: `📋 **Meeting Summary: {{meetingTitle}}**

**Key Decisions:**
{{decisions}}

**Action Items:**
{{actionItems}}

**Next Meeting:** {{nextMeeting}}

cc: {{participants}}`,
      recipients: 'all_participants',
      timing: 'immediate',
      isActive: true
    }
  ];

  /**
   * Generate action items from meeting summary
   */
  static async generateActionItems(context: MeetingContext): Promise<ActionItem[]> {
    try {
      // Use AI to extract action items from summary
      const prompt = `Analyze this meeting summary and extract clear, actionable tasks:

Meeting: ${context.title}
Date: ${context.date}
Participants: ${context.participants.map(p => p.name).join(', ')}

Summary:
${context.content}

Extract action items in this format for each task:
- Task title (clear and specific)
- Detailed description
- Assignee (if mentioned, match to participant names)
- Due date (if mentioned or can be inferred)
- Priority level (urgent/high/medium/low)
- Estimated effort in hours

Focus on concrete next steps, deliverables, and follow-up actions.`;

      const aiResponse = await this.callAI(prompt);
      const actionItems = this.parseActionItems(aiResponse, context);
      
      // Enhance action items with additional context
      const enhancedItems = await this.enhanceActionItems(actionItems, context);
      
      return enhancedItems;
    } catch (error) {
      console.error('Error generating action items:', error);
      return [];
    }
  }

  /**
   * Send automated follow-ups via email and Slack
   */
  static async sendAutoFollowups(context: MeetingContext, actionItems: ActionItem[]): Promise<FollowupResult> {
    const result: FollowupResult = {
      actionItems,
      emailsSent: 0,
      slackMessagesSent: 0,
      tasksCreated: 0,
      errors: []
    };

    try {
      // Get user's followup preferences
      const preferences = await this.getFollowupPreferences(context.summaryId);
      
      // Send email follow-ups
      if (preferences.emailEnabled) {
        const emailResult = await this.sendEmailFollowups(context, actionItems);
        result.emailsSent = emailResult.sent;
        result.errors.push(...emailResult.errors);
      }
      
      // Send Slack follow-ups
      if (preferences.slackEnabled) {
        const slackResult = await this.sendSlackFollowups(context, actionItems);
        result.slackMessagesSent = slackResult.sent;
        result.errors.push(...slackResult.errors);
      }
      
      // Create tasks in external systems
      if (preferences.taskManagerEnabled) {
        const taskResult = await this.createExternalTasks(context, actionItems);
        result.tasksCreated = taskResult.created;
        result.errors.push(...taskResult.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending auto follow-ups:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Generate follow-up email content
   */
  static async generateFollowupEmail(context: MeetingContext, actionItems: ActionItem[]): Promise<{
    subject: string;
    content: string;
    recipients: string[];
  }> {
    try {
      const template = this.FOLLOWUP_TEMPLATES.find(t => t.type === 'email' && t.isActive);
      if (!template) {
        throw new Error('No active email template found');
      }

      // Generate content using template
      const subject = this.replaceTemplateVariables(template.subject, context, actionItems);
      const content = this.replaceTemplateVariables(template.content, context, actionItems);
      
      // Determine recipients
      const recipients = this.getRecipients(template.recipients, context, actionItems);
      
      return { subject, content, recipients };
    } catch (error) {
      console.error('Error generating follow-up email:', error);
      throw error;
    }
  }

  /**
   * Generate Slack message content
   */
  static async generateSlackMessage(context: MeetingContext, actionItems: ActionItem[]): Promise<{
    text: string;
    blocks: any[];
    channel?: string;
  }> {
    try {
      // Create rich Slack message with blocks
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📋 ${context.title} - Follow-up`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Date:* ${new Date(context.date).toLocaleDateString()}\n*Participants:* ${context.participants.map(p => p.name).join(', ')}`
          }
        },
        {
          type: 'divider'
        }
      ];

      // Add action items section
      if (actionItems.length > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🎯 Action Items:*'
          }
        });

        actionItems.forEach((item, index) => {
          const assigneeText = item.assignee ? ` (${item.assignee.name})` : '';
          const dueDateText = item.dueDate ? ` - Due: ${new Date(item.dueDate).toLocaleDateString()}` : '';
          const priorityEmoji = this.getPriorityEmoji(item.priority);
          
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${priorityEmoji} *${item.title}*${assigneeText}${dueDateText}\n${item.description}`
            }
          });
        });
      }

      // Add summary section
      const summaryPreview = context.content.substring(0, 200) + (context.content.length > 200 ? '...' : '');
      blocks.push(
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📝 Summary Preview:*\n${summaryPreview}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${process.env.NEXT_PUBLIC_APP_URL}/summaries/${context.summaryId}|View Full Summary>`
          }
        }
      );

      return {
        text: `Follow-up for ${context.title}`,
        blocks,
        channel: await this.getSlackChannel(context)
      };
    } catch (error) {
      console.error('Error generating Slack message:', error);
      throw error;
    }
  }

  /**
   * Track action item completion
   */
  static async trackActionItemCompletion(actionItemId: string, status: string, completedBy?: string): Promise<void> {
    try {
      // Update action item status
      await this.updateActionItemStatus(actionItemId, status, completedBy);
      
      // Send completion notifications if needed
      if (status === 'completed') {
        await this.sendCompletionNotifications(actionItemId);
      }
      
      // Update analytics
      await this.trackCompletionMetrics(actionItemId, status);
    } catch (error) {
      console.error('Error tracking action item completion:', error);
    }
  }

  // Private helper methods
  private static async callAI(prompt: string): Promise<string> {
    // Call AI service (DeepSeek)
    console.log('AI prompt for action items:', prompt);
    
    // Mock AI response - in production, call actual AI service
    return `Action Items:
1. Create technical specification for new feature
   - Assignee: John Smith
   - Due: Next Friday
   - Priority: High
   - Description: Document API endpoints and data models

2. Schedule user interviews
   - Assignee: Sarah Johnson
   - Due: End of week
   - Priority: Medium
   - Description: Recruit 5 users for feedback sessions

3. Update project timeline
   - Assignee: Mike Chen
   - Due: Tomorrow
   - Priority: High
   - Description: Reflect new requirements in project plan`;
  }

  private static parseActionItems(aiResponse: string, context: MeetingContext): ActionItem[] {
    // Parse AI response into structured action items
    const items: ActionItem[] = [];
    
    // Mock parsing - in production, implement robust parsing
    const mockItems = [
      {
        title: 'Create technical specification',
        description: 'Document API endpoints and data models for new feature',
        assigneeName: 'John Smith',
        dueDate: 'Next Friday',
        priority: 'high' as const
      },
      {
        title: 'Schedule user interviews',
        description: 'Recruit 5 users for feedback sessions',
        assigneeName: 'Sarah Johnson',
        dueDate: 'End of week',
        priority: 'medium' as const
      }
    ];

    mockItems.forEach((mockItem, index) => {
      const assignee = context.participants.find(p => 
        p.name.toLowerCase().includes(mockItem.assigneeName.toLowerCase())
      );

      items.push({
        id: `action_${Date.now()}_${index}`,
        summaryId: context.summaryId,
        title: mockItem.title,
        description: mockItem.description,
        assignee: assignee ? {
          name: assignee.name,
          email: assignee.email,
          slackId: assignee.slackId
        } : undefined,
        dueDate: this.parseDueDate(mockItem.dueDate),
        priority: mockItem.priority,
        status: 'pending',
        tags: [],
        createdAt: new Date().toISOString()
      });
    });

    return items;
  }

  private static async enhanceActionItems(items: ActionItem[], context: MeetingContext): Promise<ActionItem[]> {
    // Enhance action items with additional context and smart defaults
    return items.map(item => ({
      ...item,
      tags: this.generateActionItemTags(item, context),
      estimatedHours: this.estimateEffort(item),
      dependencies: this.findDependencies(item, items)
    }));
  }

  private static async getFollowupPreferences(summaryId: string): Promise<any> {
    // Get user's followup preferences
    return {
      emailEnabled: true,
      slackEnabled: true,
      taskManagerEnabled: false,
      timing: 'immediate'
    };
  }

  private static async sendEmailFollowups(context: MeetingContext, actionItems: ActionItem[]): Promise<{
    sent: number;
    errors: string[];
  }> {
    try {
      const { subject, content, recipients } = await this.generateFollowupEmail(context, actionItems);
      
      // Send emails (mock implementation)
      console.log('Sending follow-up emails:', { subject, recipients: recipients.length });
      
      return { sent: recipients.length, errors: [] };
    } catch (error) {
      return { sent: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  private static async sendSlackFollowups(context: MeetingContext, actionItems: ActionItem[]): Promise<{
    sent: number;
    errors: string[];
  }> {
    try {
      const message = await this.generateSlackMessage(context, actionItems);
      
      // Send Slack message (mock implementation)
      console.log('Sending Slack follow-up:', message.text);
      
      return { sent: 1, errors: [] };
    } catch (error) {
      return { sent: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  private static async createExternalTasks(context: MeetingContext, actionItems: ActionItem[]): Promise<{
    created: number;
    errors: string[];
  }> {
    try {
      // Create tasks in external systems (Asana, Jira, etc.)
      console.log('Creating external tasks:', actionItems.length);
      
      return { created: actionItems.length, errors: [] };
    } catch (error) {
      return { created: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  private static replaceTemplateVariables(template: string, context: MeetingContext, actionItems: ActionItem[]): string {
    let result = template;
    
    // Replace basic variables
    result = result.replace(/\{\{meetingTitle\}\}/g, context.title);
    result = result.replace(/\{\{date\}\}/g, new Date(context.date).toLocaleDateString());
    result = result.replace(/\{\{participants\}\}/g, context.participants.map(p => p.name).join(', '));
    
    // Replace action items
    const actionItemsText = actionItems.map(item => {
      const assigneeText = item.assignee ? ` (${item.assignee.name})` : '';
      const dueDateText = item.dueDate ? ` - Due: ${new Date(item.dueDate).toLocaleDateString()}` : '';
      return `• ${item.title}${assigneeText}${dueDateText}\n  ${item.description}`;
    }).join('\n\n');
    
    result = result.replace(/\{\{actionItems\}\}/g, actionItemsText);
    
    // Replace summary
    const summaryPreview = context.content.substring(0, 300) + (context.content.length > 300 ? '...' : '');
    result = result.replace(/\{\{summary\}\}/g, summaryPreview);
    
    return result;
  }

  private static getRecipients(type: string, context: MeetingContext, actionItems: ActionItem[]): string[] {
    switch (type) {
      case 'all_participants':
        return context.participants.map(p => p.email);
      case 'assignees_only':
        return [...new Set(actionItems.map(item => item.assignee?.email).filter(Boolean))] as string[];
      default:
        return context.participants.map(p => p.email);
    }
  }

  private static getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private static async getSlackChannel(context: MeetingContext): Promise<string> {
    // Determine appropriate Slack channel
    return '#general'; // Mock implementation
  }

  private static parseDueDate(dueDateText: string): string | undefined {
    // Parse natural language due dates
    const now = new Date();
    
    if (dueDateText.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }
    
    if (dueDateText.toLowerCase().includes('next friday')) {
      const nextFriday = new Date(now);
      const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
      nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
      return nextFriday.toISOString();
    }
    
    if (dueDateText.toLowerCase().includes('end of week')) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (5 - now.getDay()));
      return endOfWeek.toISOString();
    }
    
    return undefined;
  }

  private static generateActionItemTags(item: ActionItem, context: MeetingContext): string[] {
    const tags: string[] = [];
    
    // Add priority tag
    if (item.priority === 'urgent' || item.priority === 'high') {
      tags.push('Priority');
    }
    
    // Add meeting type tag
    if (context.meetingType) {
      tags.push(context.meetingType);
    }
    
    // Add assignee tag
    if (item.assignee) {
      tags.push('Assigned');
    }
    
    return tags;
  }

  private static estimateEffort(item: ActionItem): number {
    // Simple effort estimation based on description length and keywords
    const description = item.description.toLowerCase();
    
    if (description.includes('create') || description.includes('develop')) return 8;
    if (description.includes('review') || description.includes('update')) return 2;
    if (description.includes('schedule') || description.includes('send')) return 1;
    
    return 4; // Default estimate
  }

  private static findDependencies(item: ActionItem, allItems: ActionItem[]): string[] {
    // Find potential dependencies between action items
    const dependencies: string[] = [];
    
    // Simple dependency detection based on keywords
    const itemKeywords = item.description.toLowerCase();
    
    allItems.forEach(otherItem => {
      if (otherItem.id !== item.id) {
        const otherKeywords = otherItem.description.toLowerCase();
        
        // If this item mentions "after" or "once" and references another item
        if (itemKeywords.includes('after') || itemKeywords.includes('once')) {
          dependencies.push(otherItem.id);
        }
      }
    });
    
    return dependencies;
  }

  private static async updateActionItemStatus(actionItemId: string, status: string, completedBy?: string): Promise<void> {
    // Update action item in database
    console.log('Updating action item status:', actionItemId, status);
  }

  private static async sendCompletionNotifications(actionItemId: string): Promise<void> {
    // Send notifications about completed action items
    console.log('Sending completion notifications for:', actionItemId);
  }

  private static async trackCompletionMetrics(actionItemId: string, status: string): Promise<void> {
    // Track metrics for analytics
    console.log('Tracking completion metrics:', actionItemId, status);
  }
}
