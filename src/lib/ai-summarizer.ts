import OpenAI from 'openai';
import { AIPersonalizationService, PersonalizationSettings } from './ai-personalization';

// OpenRouter AI Service Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize OpenRouter client
const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Slack Summarizer SaaS"
  }
});

// Model configurations
const PRIMARY_MODEL = "deepseek/deepseek-r1:free";
const FALLBACK_MODEL = "openai/gpt-4o-mini";

export interface SummaryRequest {
  transcriptText: string;
  userId: string;
  teamId?: string;
  tags?: string[];
  context?: {
    source: 'slack' | 'manual' | 'api';
    channel?: string;
    participants?: string[];
    duration?: number;
  };
  personalization?: PersonalizationSettings;
}

export interface SummaryResult {
  title: string;
  summary: string;
  bullets: string[];
  actionItems: string[];
  speakerBreakdown: {
    speaker: string;
    keyPoints: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];
  // New fields for Slack integration
  keyPoints?: string[];
  decisions?: string[];
  participants?: string[];
  topics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
  wordCount?: number;
  messageCount?: number;
  channelId?: string;
  channelName?: string;
  skills: string[];
  redFlags: string[];
  confidence: number; // 0-1
  processingTimeMs: number;
  model: string;
}

export class AISummarizer {
  /**
   * Generate AI summary using available AI service with enhanced error handling and personalization
   */
  static async generateSummary(request: SummaryRequest): Promise<{ data: SummaryResult | null; error: string | null }> {
    const startTime = Date.now();

    // Use personalization settings or defaults
    const personalization = request.personalization || AIPersonalizationService.getDefaultSettings();

    try {
      // Enhanced input validation
      if (!request.transcriptText || request.transcriptText.trim().length === 0) {
        return { data: null, error: 'Transcript text is required' };
      }

      const trimmedText = request.transcriptText.trim();

      // Check for minimum meaningful content
      if (trimmedText.length < 10) {
        return { data: null, error: 'Transcript too short (minimum 10 characters)' };
      }

      // Handle large transcripts with chunking
      if (trimmedText.length > 50000) {
        console.warn('Large transcript detected, attempting chunked processing');
        return await this.handleLargeTranscript(request);
      }

      // Check for potentially problematic content
      const contentIssues = this.validateTranscriptContent(trimmedText);
      if (contentIssues.length > 0) {
        console.warn('Content validation issues:', contentIssues);
        // Continue processing but log warnings
      }

      // Enhanced AI service with retry logic using DeepSeek
      let result: SummaryResult | null = null;
      let lastError: string | null = null;
      const maxRetries = 2;

      // Try OpenRouter with DeepSeek R1 and fallback to GPT-4o-mini
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const openRouterResult = await this.generateOpenRouterSummary(request);
          if (openRouterResult.data) {
            result = openRouterResult.data;
            break;
          } else {
            lastError = openRouterResult.error;
            if (attempt < maxRetries) {
              console.warn(`OpenRouter attempt ${attempt} failed, retrying...`);
              await this.delay(1000 * attempt);
            }
          }
        }
      }

      // Enhanced fallback with better mock data
      if (!result) {
        console.warn('DeepSeek AI service failed, using enhanced mock data');
        result = this.generateEnhancedMockSummary(request, lastError);
      }

      if (result) {
        result.processingTimeMs = Date.now() - startTime;
        return { data: result, error: null };
      }

      return { data: null, error: 'Failed to generate summary' };
    } catch (error) {
      console.error('AI summarization error:', error);
      return { data: null, error: 'Unexpected error during summarization' };
    }
  }

  /**
   * Generate summary using OpenRouter (DeepSeek R1 with GPT-4o-mini fallback)
   */
  private static async generateOpenRouterSummary(request: SummaryRequest): Promise<{ data: SummaryResult | null; error: string | null }> {
    const promptText = this.buildPrompt(request);

    try {
      // Try DeepSeek R1 first
      const completion = await openRouterClient.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert AI assistant that analyzes conversations and creates structured summaries. Always respond with valid JSON."
          },
          {
            role: "user",
            content: promptText
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from DeepSeek R1');
      }

      const parsed = this.parseAIResponse(content, PRIMARY_MODEL);
      return { data: parsed, error: null };

    } catch (error: any) {
      console.error('DeepSeek R1 failed, trying GPT-4o-mini fallback:', error);

      // Fallback to GPT-4o-mini
      try {
        const fallbackCompletion = await openRouterClient.chat.completions.create({
          model: FALLBACK_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an expert AI assistant that analyzes conversations and creates structured summaries. Always respond with valid JSON."
            },
            {
              role: "user",
              content: promptText
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        });

        const fallbackContent = fallbackCompletion.choices?.[0]?.message?.content;

        if (!fallbackContent) {
          return { data: null, error: 'No response from fallback model' };
        }

        const parsed = this.parseAIResponse(fallbackContent, FALLBACK_MODEL);
        return { data: parsed, error: null };

      } catch (fallbackError: any) {
        console.error('Both DeepSeek R1 and GPT-4o-mini failed:', fallbackError);
        return { data: null, error: `All AI models failed. Primary: ${error.message}, Fallback: ${fallbackError.message}` };
      }
    }
  }

  /**
   * Build the AI prompt for summarization with personalization
   */
  private static buildPrompt(request: SummaryRequest): string {
    // Use personalized prompt if available
    if (request.personalization) {
      try {
        return AIPersonalizationService.generatePersonalizedPrompt(
          request.transcriptText,
          request.personalization
        );
      } catch (error) {
        console.warn('Failed to generate personalized prompt, falling back to default:', error);
      }
    }

    // Fallback to original prompt structure
    const contextInfo = request.context ? `
Context: ${request.context.source} conversation${request.context.channel ? ` in ${request.context.channel}` : ''}
${request.context.participants ? `Participants: ${request.context.participants.join(', ')}` : ''}
${request.context.duration ? `Duration: ${request.context.duration} minutes` : ''}
` : '';

    return `${contextInfo}
Please analyze the following conversation transcript and provide a structured summary in JSON format:

{
  "title": "Brief descriptive title (max 60 chars)",
  "summary": "2-3 sentence overview of the conversation",
  "bullets": ["Key point 1", "Key point 2", "Key point 3"],
  "actionItems": ["Action item 1", "Action item 2"],
  "speakerBreakdown": [
    {
      "speaker": "Speaker name or role",
      "keyPoints": ["Point 1", "Point 2"],
      "sentiment": "positive|neutral|negative"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "redFlags": ["Red flag 1", "Red flag 2"],
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high",
  "confidence": 0.95
}

Transcript:
${request.transcriptText}

Respond only with valid JSON. No additional text or formatting.`;
  }

  /**
   * Parse AI response and structure the result
   */
  private static parseAIResponse(content: string, model: string): SummaryResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      
      const parsed = JSON.parse(jsonStr);
      
      return {
        title: parsed.title || 'Conversation Summary',
        summary: parsed.summary || 'Summary not available',
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        speakerBreakdown: Array.isArray(parsed.speakerBreakdown) ? parsed.speakerBreakdown : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
        urgency: ['low', 'medium', 'high'].includes(parsed.urgency) ? parsed.urgency : 'medium',
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.8,
        processingTimeMs: 0, // Will be set by caller
        model,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a fallback summary
      return this.generateEnhancedMockSummary({ transcriptText: content, userId: 'unknown' });
    }
  }

  /**
   * Handle large transcripts by chunking
   */
  private static async handleLargeTranscript(request: SummaryRequest): Promise<{ data: SummaryResult | null; error: string | null }> {
    try {
      const chunkSize = 40000; // Safe chunk size
      const text = request.transcriptText;
      const chunks = [];

      // Split into chunks at sentence boundaries when possible
      for (let i = 0; i < text.length; i += chunkSize) {
        let chunk = text.slice(i, i + chunkSize);

        // Try to end at a sentence boundary
        if (i + chunkSize < text.length) {
          const lastPeriod = chunk.lastIndexOf('.');
          const lastNewline = chunk.lastIndexOf('\n');
          const boundary = Math.max(lastPeriod, lastNewline);

          if (boundary > chunkSize * 0.8) { // Only if boundary is reasonably close to end
            chunk = chunk.slice(0, boundary + 1);
            i = i + boundary + 1 - chunkSize; // Adjust next starting position
          }
        }

        chunks.push(chunk);
      }

      console.log(`Processing large transcript in ${chunks.length} chunks`);

      // Process each chunk and combine results
      const chunkResults = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkRequest = { ...request, transcriptText: chunks[i] };
        const result = await this.generateSummary(chunkRequest);

        if (result.data) {
          chunkResults.push(result.data);
        }
      }

      if (chunkResults.length === 0) {
        return { data: null, error: 'Failed to process any chunks of large transcript' };
      }

      // Combine chunk results
      const combinedResult = this.combineChunkResults(chunkResults, request);
      return { data: combinedResult, error: null };

    } catch (error) {
      return { data: null, error: `Large transcript processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Validate transcript content for potential issues
   */
  private static validateTranscriptContent(text: string): string[] {
    const issues = [];

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalWords = words.length;
    const mostCommonWord = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonWord && mostCommonWord[1] > totalWords * 0.1) {
      issues.push(`Excessive repetition of word "${mostCommonWord[0]}" (${mostCommonWord[1]} times)`);
    }

    // Check for potential encoding issues
    if (/[\uFFFD]/.test(text)) {
      issues.push('Potential encoding issues detected');
    }

    // Check for very long lines (potential formatting issues)
    const lines = text.split('\n');
    const longLines = lines.filter(line => line.length > 1000);
    if (longLines.length > 0) {
      issues.push(`${longLines.length} very long lines detected (potential formatting issues)`);
    }

    return issues;
  }

  /**
   * Combine results from multiple chunks
   */
  private static combineChunkResults(chunkResults: SummaryResult[], originalRequest: SummaryRequest): SummaryResult {
    const allSkills = [...new Set(chunkResults.flatMap(r => r.skills))];
    const allRedFlags = [...new Set(chunkResults.flatMap(r => r.redFlags))];
    const allActionItems = [...new Set(chunkResults.flatMap(r => r.actionItems))];
    const allBullets = chunkResults.flatMap(r => r.bullets);

    // Average confidence
    const avgConfidence = chunkResults.reduce((sum, r) => sum + r.confidence, 0) / chunkResults.length;

    // Combine processing times
    const totalProcessingTime = chunkResults.reduce((sum, r) => sum + r.processingTimeMs, 0);

    return {
      title: `Combined Analysis (${chunkResults.length} parts)`,
      summary: `Combined analysis of ${originalRequest.transcriptText.length} character transcript processed in ${chunkResults.length} chunks. Key themes and insights have been merged from all sections.`,
      bullets: allBullets.slice(0, 10), // Limit to top 10 bullets
      actionItems: allActionItems.slice(0, 8), // Limit to top 8 actions
      speakerBreakdown: chunkResults.flatMap(r => r.speakerBreakdown),
      skills: allSkills.slice(0, 15), // Limit to top 15 skills
      redFlags: allRedFlags.slice(0, 10), // Limit to top 10 red flags
      sentiment: this.determineCombinedSentiment(chunkResults),
      urgency: this.determineCombinedUrgency(chunkResults),
      confidence: avgConfidence,
      processingTimeMs: totalProcessingTime,
      model: `combined-${chunkResults[0]?.model || 'unknown'}`
    };
  }

  /**
   * Determine combined sentiment from chunks
   */
  private static determineCombinedSentiment(results: SummaryResult[]): 'positive' | 'neutral' | 'negative' {
    const sentiments = results.map(r => r.sentiment);
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  /**
   * Determine combined urgency from chunks
   */
  private static determineCombinedUrgency(results: SummaryResult[]): 'low' | 'medium' | 'high' {
    const urgencies = results.map(r => r.urgency);
    if (urgencies.includes('high')) return 'high';
    if (urgencies.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Delay utility for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced mock summary with error context
   */
  private static generateEnhancedMockSummary(request: SummaryRequest, lastError?: string | null): SummaryResult {
    const wordCount = request.transcriptText.split(' ').length;
    const hasQuestions = request.transcriptText.includes('?');
    const hasNumbers = /\d/.test(request.transcriptText);

    return {
      title: 'Fallback Analysis Summary',
      summary: `Fallback analysis of ${wordCount} word conversation. AI services were unavailable${lastError ? ` (${lastError})` : ''}. This summary provides basic content analysis.`,
      bullets: [
        'Content analyzed using fallback system',
        `Document contains ${wordCount} words`,
        hasQuestions ? 'Interactive discussion detected' : 'Informational content detected',
        hasNumbers ? 'Quantitative data present' : 'Qualitative content focus',
        'Manual review recommended for detailed insights'
      ],
      actionItems: [
        'Configure AI API keys for enhanced analysis',
        'Review content manually for specific insights',
        'Consider re-processing when AI services are available'
      ],
      speakerBreakdown: [
        {
          speaker: 'Content Analysis',
          keyPoints: ['Basic content structure analyzed'],
          sentiment: 'neutral' as const
        }
      ],
      skills: this.extractBasicSkills(request.transcriptText),
      redFlags: [
        'AI service unavailable - limited analysis',
        ...(lastError ? [`Service error: ${lastError}`] : [])
      ],
      sentiment: 'neutral' as const,
      urgency: 'low' as const,
      confidence: 0.2, // Low confidence for fallback
      processingTimeMs: 0,
      model: 'enhanced-fallback'
    };
  }

  /**
   * Extract basic skills from text using keyword matching
   */
  private static extractBasicSkills(text: string): string[] {
    const skillKeywords = {
      'JavaScript': /javascript|js\b|node\.?js/i,
      'React': /react|jsx|hooks/i,
      'TypeScript': /typescript|ts\b/i,
      'Python': /python|django|flask/i,
      'Communication': /communication|discuss|explain|present/i,
      'Leadership': /lead|manage|coordinate|organize/i,
      'Problem Solving': /solve|fix|debug|troubleshoot/i,
      'Testing': /test|qa|quality|bug/i,
      'Database': /database|sql|mongodb|postgres/i,
      'API': /api|rest|graphql|endpoint/i
    };

    const detectedSkills = [];
    for (const [skill, pattern] of Object.entries(skillKeywords)) {
      if (pattern.test(text)) {
        detectedSkills.push(skill);
      }
    }

    return detectedSkills.length > 0 ? detectedSkills : ['General Discussion'];
  }
}

// Slack-specific summarization functions
export interface SlackSummarizationOptions {
  style?: 'brief' | 'detailed' | 'executive';
  focus?: 'decisions' | 'actions' | 'discussion' | 'all';
  includeParticipants?: boolean;
  includeTimestamps?: boolean;
  maxLength?: number;
}

// Summarize Slack conversation content
export async function summarizeSlackConversation(
  content: string,
  channelName: string,
  options: SlackSummarizationOptions = {}
): Promise<SummaryResult> {
  const {
    style = 'detailed',
    focus = 'all',
    includeParticipants = true,
    maxLength = 500
  } = options;

  try {
    const prompt = createSlackSummarizationPrompt(content, channelName, options);

    // Try DeepSeek R1 first
    try {
      const completion = await openRouterClient.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing Slack team conversations and creating concise, actionable summaries. Focus on extracting key decisions, action items, and important discussions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const aiResponse = completion.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from DeepSeek R1');
      }

      // Parse the response and format it
      return parseSlackSummaryResponse(aiResponse, content, channelName);

    } catch (primaryError) {
      console.error('DeepSeek R1 failed for Slack summarization, trying GPT-4o-mini:', primaryError);

      // Fallback to GPT-4o-mini
      const fallbackCompletion = await openRouterClient.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing Slack team conversations and creating concise, actionable summaries. Focus on extracting key decisions, action items, and important discussions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const fallbackResponse = fallbackCompletion.choices[0]?.message?.content;

      if (!fallbackResponse) {
        throw new Error('No response from GPT-4o-mini fallback');
      }

      // Parse the response and format it
      return parseSlackSummaryResponse(fallbackResponse, content, channelName);
    }

  } catch (error) {
    console.error('Error with Slack summarization (all models failed):', error);

    // Fallback to basic summarization
    return createSlackFallbackSummary(content, channelName);
  }
}

// Create Slack-specific summarization prompt
function createSlackSummarizationPrompt(content: string, channelName: string, options: SlackSummarizationOptions): string {
  const { style, focus, includeParticipants } = options;

  let prompt = `Please analyze the following Slack conversation from channel #${channelName} and provide a structured summary.

The conversation content:
${content}

Please provide:
1. A concise title for this conversation (max 60 characters)
2. A ${style} summary of the main discussion points
3. Key points discussed (3-5 most important points)
4. Action items or tasks mentioned
5. Decisions made during the conversation
6. Main topics/themes discussed
7. Overall sentiment (positive, neutral, or negative)
8. Urgency level (low, medium, or high)`;

  if (includeParticipants) {
    prompt += `\n9. Key participants who contributed significantly`;
  }

  if (focus !== 'all') {
    prompt += `\n\nPay special attention to ${focus} in the conversation.`;
  }

  prompt += `\n\nFormat your response clearly with sections for each element.`;

  return prompt;
}

// Parse AI response for Slack summary
function parseSlackSummaryResponse(aiResponse: string, content: string, channelName: string): SummaryResult {
  const lines = content.split('\n').filter(line => line.trim());
  const messageLines = lines.filter(line => line.includes(']:'));

  // Extract participants
  const participants = new Set<string>();
  messageLines.forEach(line => {
    const match = line.match(/\] ([^:]+):/);
    if (match) {
      participants.add(match[1]);
    }
  });

  // Try to extract structured information from AI response
  const titleMatch = aiResponse.match(/title[:\-\s]*([^\n]+)/i);
  const summaryMatch = aiResponse.match(/summary[:\-\s]*([^\n]+(?:\n(?!(?:key|action|decision|topic|sentiment|urgency|participant))[^\n]*)*)/i);

  return {
    title: titleMatch?.[1]?.trim() || `#${channelName} Discussion`,
    summary: summaryMatch?.[1]?.trim() || `Discussion in #${channelName} with ${participants.size} participants`,
    bullets: extractBulletPoints(aiResponse),
    actionItems: extractActionItems(aiResponse),
    speakerBreakdown: Array.from(participants).slice(0, 5).map(name => ({
      speaker: name,
      keyPoints: [`Participated in #${channelName} discussion`],
      sentiment: 'neutral' as const
    })),
    keyPoints: extractKeyPoints(aiResponse),
    decisions: extractDecisions(aiResponse),
    participants: Array.from(participants).slice(0, 5),
    topics: extractTopics(aiResponse),
    sentiment: extractSentiment(aiResponse),
    urgency: extractUrgency(aiResponse),
    wordCount: content.split(' ').length,
    messageCount: messageLines.length,
    channelName: channelName,
    skills: [],
    redFlags: [],
    confidence: 0.8,
    processingTimeMs: 0,
    model: 'fallback-parser'
  };
}

// Helper functions to extract information from AI response
function extractBulletPoints(text: string): string[] {
  const matches = text.match(/(?:key points?|bullets?)[:\-\s]*\n?((?:\s*[-•*]\s*[^\n]+\n?)+)/i);
  if (matches) {
    return matches[1].split('\n').map(line => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  }
  return [];
}

function extractActionItems(text: string): string[] {
  const matches = text.match(/(?:action items?|tasks?)[:\-\s]*\n?((?:\s*[-•*]\s*[^\n]+\n?)+)/i);
  if (matches) {
    return matches[1].split('\n').map(line => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  }
  return [];
}

function extractKeyPoints(text: string): string[] {
  return extractBulletPoints(text);
}

function extractDecisions(text: string): string[] {
  const matches = text.match(/(?:decisions?)[:\-\s]*\n?((?:\s*[-•*]\s*[^\n]+\n?)+)/i);
  if (matches) {
    return matches[1].split('\n').map(line => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  }
  return [];
}

function extractTopics(text: string): string[] {
  const matches = text.match(/(?:topics?|themes?)[:\-\s]*\n?((?:\s*[-•*]\s*[^\n]+\n?)+)/i);
  if (matches) {
    return matches[1].split('\n').map(line => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  }
  return ['General Discussion'];
}

function extractSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const sentimentMatch = text.match(/sentiment[:\-\s]*(\w+)/i);
  const sentiment = sentimentMatch?.[1]?.toLowerCase();
  return ['positive', 'negative'].includes(sentiment || '') ? sentiment as any : 'neutral';
}

function extractUrgency(text: string): 'low' | 'medium' | 'high' {
  const urgencyMatch = text.match(/urgency[:\-\s]*(\w+)/i);
  const urgency = urgencyMatch?.[1]?.toLowerCase();
  return ['low', 'high'].includes(urgency || '') ? urgency as any : 'medium';
}

// Fallback summarization for Slack when AI fails
function createSlackFallbackSummary(content: string, channelName: string): SummaryResult {
  const lines = content.split('\n').filter(line => line.trim());
  const messageLines = lines.filter(line => line.includes(']:'));

  // Extract participants
  const participants = new Set<string>();
  messageLines.forEach(line => {
    const match = line.match(/\] ([^:]+):/);
    if (match) {
      participants.add(match[1]);
    }
  });

  // Extract potential action items
  const actionWords = ['will', 'should', 'need to', 'must', 'have to', 'going to'];
  const actionItems = messageLines
    .filter(line => actionWords.some(word => line.toLowerCase().includes(word)))
    .slice(0, 3)
    .map(line => line.split(']: ')[1] || line);

  return {
    title: `#${channelName} Team Discussion`,
    summary: `Discussion in #${channelName} involving ${participants.size} participants with ${messageLines.length} messages.`,
    bullets: [`${messageLines.length} messages exchanged`, `${participants.size} participants involved`],
    actionItems: actionItems.length > 0 ? actionItems : ['Review full conversation for action items'],
    speakerBreakdown: Array.from(participants).slice(0, 5).map(name => ({
      speaker: name,
      keyPoints: [`Participated in #${channelName} discussion`],
      sentiment: 'neutral' as const
    })),
    keyPoints: ['Team discussion took place', 'Multiple participants contributed'],
    decisions: ['Review conversation for decisions made'],
    participants: Array.from(participants).slice(0, 5),
    topics: ['General Discussion'],
    sentiment: 'neutral' as const,
    urgency: 'medium' as const,
    wordCount: content.split(' ').length,
    messageCount: messageLines.length,
    channelName: channelName,
    skills: [],
    redFlags: [],
    confidence: 0.6,
    processingTimeMs: 0,
    model: 'simple-parser'
  };
}
