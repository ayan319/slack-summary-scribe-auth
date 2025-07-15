import { createSupabaseServerClient } from './supabase-server';

// Types for AI tagging
export interface SummaryTags {
  skills: string[];
  technologies: string[];
  roles: string[];
  action_items: string[];
  decisions: string[];
  sentiments: string[];
  emotions: string[];
  confidence_score: number;
}

export interface TaggingResult {
  success: boolean;
  tags?: SummaryTags;
  error?: string;
  processing_time_ms?: number;
}

/**
 * Extract structured tags from a summary using GPT-4o-mini
 */
export async function extractSummaryTags(
  summaryText: string,
  summaryId: string,
  userId: string
): Promise<TaggingResult> {
  const startTime = Date.now();

  try {
    // Check if user has premium access for GPT-4o-mini tagging
    const hasAccess = await checkPremiumAccess(userId);
    if (!hasAccess) {
      return {
        success: false,
        error: 'Premium subscription required for smart tagging feature'
      };
    }

    // Call OpenRouter API with GPT-4o-mini for structured tagging
    const taggingPrompt = `
Analyze the following summary and extract structured information in JSON format.

Summary:
${summaryText}

Extract the following information and return ONLY a valid JSON object with these exact keys:
{
  "skills": ["skill1", "skill2"],
  "technologies": ["tech1", "tech2"],
  "roles": ["role1", "role2"],
  "action_items": ["action1", "action2"],
  "decisions": ["decision1", "decision2"],
  "sentiments": ["positive", "negative", "neutral"],
  "emotions": ["excited", "concerned", "confident"],
  "confidence_score": 0.85
}

Guidelines:
- skills: Professional skills mentioned (e.g., "project management", "data analysis")
- technologies: Tools, platforms, software mentioned (e.g., "React", "AWS", "Slack")
- roles: Job titles or positions mentioned (e.g., "developer", "manager", "designer")
- action_items: Tasks or actions to be taken (e.g., "schedule meeting", "review code")
- decisions: Decisions made or needed (e.g., "approved budget", "choose vendor")
- sentiments: Overall sentiment indicators (positive, negative, neutral, mixed)
- emotions: Emotional tone indicators (excited, concerned, confident, frustrated, etc.)
- confidence_score: Float between 0.0-1.0 indicating extraction confidence

Return ONLY the JSON object, no additional text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://slack-summary-scribe.vercel.app',
        'X-Title': 'Slack Summary Scribe - Smart Tagging'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured information from text. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: taggingPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    // Parse the JSON response
    let tags: SummaryTags;
    try {
      tags = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI tagging response:', aiResponse);
      throw new Error('Invalid JSON response from AI model');
    }

    // Validate the response structure
    const validatedTags = validateTags(tags);
    const processingTime = Date.now() - startTime;

    // Store tags in database
    await storeSummaryTags(summaryId, validatedTags, processingTime);

    // Track AI usage
    await trackAIUsage(userId, 'gpt-4o-mini', 'tagging', data.usage?.total_tokens || 0, processingTime);

    return {
      success: true,
      tags: validatedTags,
      processing_time_ms: processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI tagging error:', error);

    // Track failed usage
    await trackAIUsage(userId, 'gpt-4o-mini', 'tagging', 0, processingTime, false, error instanceof Error ? error.message : 'Unknown error');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processing_time_ms: processingTime
    };
  }
}

/**
 * Validate and sanitize extracted tags
 */
function validateTags(tags: any): SummaryTags {
  return {
    skills: Array.isArray(tags.skills) ? tags.skills.slice(0, 20) : [],
    technologies: Array.isArray(tags.technologies) ? tags.technologies.slice(0, 20) : [],
    roles: Array.isArray(tags.roles) ? tags.roles.slice(0, 10) : [],
    action_items: Array.isArray(tags.action_items) ? tags.action_items.slice(0, 15) : [],
    decisions: Array.isArray(tags.decisions) ? tags.decisions.slice(0, 10) : [],
    sentiments: Array.isArray(tags.sentiments) ? tags.sentiments.slice(0, 5) : [],
    emotions: Array.isArray(tags.emotions) ? tags.emotions.slice(0, 5) : [],
    confidence_score: typeof tags.confidence_score === 'number' 
      ? Math.max(0, Math.min(1, tags.confidence_score))
      : 0.5
  };
}

/**
 * Store tags in the database
 */
async function storeSummaryTags(
  summaryId: string,
  tags: SummaryTags,
  processingTimeMs: number
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('summary_tags')
    .upsert({
      summary_id: summaryId,
      tags: tags,
      skills: tags.skills,
      technologies: tags.technologies,
      roles: tags.roles,
      action_items: tags.action_items,
      decisions: tags.decisions,
      sentiments: tags.sentiments,
      emotions: tags.emotions,
      confidence_score: tags.confidence_score,
      ai_model: 'gpt-4o-mini',
      processing_time_ms: processingTimeMs,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error storing summary tags:', error);
    throw new Error('Failed to store tags in database');
  }
}

/**
 * Check if user has premium access for tagging
 */
async function checkPremiumAccess(userId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    // Check user's subscription plan
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select(`
        organization_id,
        organizations!inner(subscription_plan)
      `)
      .eq('user_id', userId)
      .eq('organizations.subscription_plan', 'PRO')
      .or('organizations.subscription_plan.eq.ENTERPRISE');

    return Boolean(userOrgs && userOrgs.length > 0);
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
}

/**
 * Track AI usage for billing and analytics
 */
async function trackAIUsage(
  userId: string,
  aiModel: string,
  operationType: string,
  tokensUsed: number,
  processingTimeMs: number,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get user's organization (use first one for tracking)
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!userOrg) return;

    // Calculate approximate cost (rough estimates)
    const costPerToken = aiModel === 'gpt-4o-mini' ? 0.00015 / 1000 : 0.00002 / 1000; // USD per token
    const costUsd = tokensUsed * costPerToken;

    await supabase
      .from('ai_usage_tracking')
      .insert({
        user_id: userId,
        organization_id: userOrg.organization_id,
        ai_model: aiModel,
        operation_type: operationType,
        tokens_used: tokensUsed,
        cost_usd: costUsd,
        processing_time_ms: processingTimeMs,
        success,
        error_message: errorMessage
      });

  } catch (error) {
    console.error('Error tracking AI usage:', error);
    // Don't throw error as this is non-critical
  }
}

/**
 * Get tags for a summary
 */
export async function getSummaryTags(summaryId: string): Promise<SummaryTags | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('summary_tags')
      .select('*')
      .eq('summary_id', summaryId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.tags as SummaryTags;
  } catch (error) {
    console.error('Error getting summary tags:', error);
    return null;
  }
}
