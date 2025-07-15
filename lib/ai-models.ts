import { SubscriptionPlan } from '@prisma/client';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai' | 'anthropic';
  model: string;
  maxTokens: number;
  costPer1kTokens: number;
  requiredPlan: SubscriptionPlan;
  features: string[];
  description: string;
}

export const AI_MODELS: Record<string, AIModel> = {
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1:free',
    maxTokens: 4000,
    costPer1kTokens: 0.0,
    requiredPlan: 'FREE',
    features: ['Basic summarization', 'Fast processing', 'Free tier'],
    description: 'Fast and efficient AI model for basic summarization tasks'
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    maxTokens: 8000,
    costPer1kTokens: 0.15,
    requiredPlan: 'PRO',
    features: ['Premium summarization', 'Smart tagging', 'Enhanced analysis', 'Better context'],
    description: 'OpenAI\'s efficient model optimized for high-quality summarization and analysis'
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openrouter',
    model: 'openai/gpt-4o',
    maxTokens: 8000,
    costPer1kTokens: 0.30,
    requiredPlan: 'ENTERPRISE',
    features: ['Advanced reasoning', 'Superior context understanding', 'Enterprise quality'],
    description: 'OpenAI\'s most capable model with superior reasoning and analysis'
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    maxTokens: 8000,
    costPer1kTokens: 0.30,
    requiredPlan: 'ENTERPRISE',
    features: ['Excellent writing quality', 'Nuanced analysis', 'Enterprise insights'],
    description: 'Anthropic\'s most advanced model with exceptional writing and analysis capabilities'
  },
  'gpt-4o-enterprise': {
    id: 'gpt-4o-enterprise',
    name: 'GPT-4o Enterprise',
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 16000,
    costPer1kTokens: 0.03,
    requiredPlan: 'ENTERPRISE',
    features: ['Extended context', 'Priority processing', 'Custom fine-tuning'],
    description: 'Enterprise-grade GPT-4o with extended context and priority processing'
  }
};

export function getAvailableModels(userPlan: SubscriptionPlan): AIModel[] {
  const planHierarchy: Record<SubscriptionPlan, number> = {
    'FREE': 0,
    'PRO': 1,
    'ENTERPRISE': 2
  };

  const userPlanLevel = planHierarchy[userPlan];
  
  return Object.values(AI_MODELS).filter(model => {
    const modelPlanLevel = planHierarchy[model.requiredPlan];
    return modelPlanLevel <= userPlanLevel;
  });
}

export function getDefaultModel(userPlan: SubscriptionPlan): string {
  switch (userPlan) {
    case 'FREE':
      return 'deepseek-r1';
    case 'PRO':
      return 'gpt-4o-mini';
    case 'ENTERPRISE':
      return 'gpt-4o';
    default:
      return 'deepseek-r1';
  }
}

/**
 * Get premium model for user's plan with fallback
 */
export function getPremiumModel(userPlan: SubscriptionPlan, preferredModel?: string): string {
  // If user specified a preferred model and can use it, return that
  if (preferredModel && canUseModel(userPlan, preferredModel)) {
    return preferredModel;
  }

  // Otherwise return the default premium model for their plan
  return getDefaultModel(userPlan);
}

/**
 * Get fallback model if primary model fails
 */
export function getFallbackModel(userPlan: SubscriptionPlan, failedModel: string): string {
  // If premium model fails, fall back to free model
  if (failedModel !== 'deepseek-r1') {
    return 'deepseek-r1';
  }

  // If free model fails, no fallback available
  throw new Error('No fallback model available');
}

export function canUseModel(userPlan: SubscriptionPlan, modelId: string): boolean {
  const model = AI_MODELS[modelId];
  if (!model) return false;

  const planHierarchy: Record<SubscriptionPlan, number> = {
    'FREE': 0,
    'PRO': 1,
    'ENTERPRISE': 2
  };

  const userPlanLevel = planHierarchy[userPlan];
  const modelPlanLevel = planHierarchy[model.requiredPlan];
  
  return modelPlanLevel <= userPlanLevel;
}

export interface AIResponse {
  text: string;
  model: string;
  tokens: {
    input: number;
    output: number;
  };
  cost: number;
  processingTime: number;
  qualityScores?: {
    coherence: number;
    coverage: number;
    style: number;
    length: number;
    overall: number;
  };
}

export async function generateAISummary(
  text: string,
  modelId: string,
  context?: string
): Promise<AIResponse> {
  const model = AI_MODELS[modelId];
  if (!model) {
    throw new Error(`Unknown AI model: ${modelId}`);
  }

  const startTime = Date.now();

  try {
    let response: any;

    switch (model.provider) {
      case 'openrouter':
        response = await generateOpenRouterSummary(text, model, context);
        break;
      case 'openai':
        response = await generateOpenAISummary(text, model, context);
        break;
      case 'anthropic':
        response = await generateAnthropicSummary(text, model, context);
        break;
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }

    const processingTime = Date.now() - startTime;
    const inputTokens = estimateTokens(text);
    const outputTokens = estimateTokens(response.text);
    const cost = ((inputTokens + outputTokens) / 1000) * model.costPer1kTokens;

    return {
      text: response.text,
      model: modelId,
      tokens: {
        input: inputTokens,
        output: outputTokens
      },
      cost,
      processingTime,
      qualityScores: response.qualityScores
    };
  } catch (error) {
    console.error(`AI generation failed for model ${modelId}:`, error);
    throw error;
  }
}

/**
 * Generate AI summary with premium model and fallback
 */
export async function generatePremiumAISummary(
  text: string,
  userPlan: SubscriptionPlan,
  preferredModel?: string,
  context?: string
): Promise<AIResponse> {
  const primaryModel = getPremiumModel(userPlan, preferredModel);

  try {
    // Try primary model first
    return await generateAISummary(text, primaryModel, context);
  } catch (primaryError) {
    console.warn(`Primary model ${primaryModel} failed, trying fallback:`, primaryError);

    try {
      // Try fallback model
      const fallbackModel = getFallbackModel(userPlan, primaryModel);
      const result = await generateAISummary(text, fallbackModel, context);

      // Add note about fallback in the response
      return {
        ...result,
        model: `${fallbackModel} (fallback from ${primaryModel})`
      };
    } catch (fallbackError) {
      console.error('Both primary and fallback models failed:', {
        primaryModel,
        primaryError,
        fallbackError
      });
      throw new Error(`AI summarization failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
    }
  }
}

async function generateOpenRouterSummary(text: string, model: AIModel, context?: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Slack Summary Scribe'
    },
    body: JSON.stringify({
      model: model.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing conversations and creating structured summaries. ${context ? `Context: ${context}` : ''}`
        },
        {
          role: 'user',
          content: `Please create a comprehensive summary of the following text:\n\n${text}`
        }
      ],
      max_tokens: model.maxTokens,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    qualityScores: await calculateQualityScores(text, data.choices[0].message.content)
  };
}

async function generateOpenAISummary(text: string, model: AIModel, context?: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing conversations and creating structured summaries. ${context ? `Context: ${context}` : ''}`
        },
        {
          role: 'user',
          content: `Please create a comprehensive summary of the following text:\n\n${text}`
        }
      ],
      max_tokens: model.maxTokens,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    qualityScores: await calculateQualityScores(text, data.choices[0].message.content)
  };
}

async function generateAnthropicSummary(text: string, model: AIModel, context?: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model.model,
      max_tokens: model.maxTokens,
      messages: [
        {
          role: 'user',
          content: `${context ? `Context: ${context}\n\n` : ''}Please create a comprehensive summary of the following text:\n\n${text}`
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.content[0].text,
    qualityScores: await calculateQualityScores(text, data.content[0].text)
  };
}

function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

async function calculateQualityScores(originalText: string, summary: string) {
  // Simple quality scoring algorithm
  const originalLength = originalText.length;
  const summaryLength = summary.length;
  
  // Length score: ideal ratio is 10-20% of original
  const compressionRatio = summaryLength / originalLength;
  const lengthScore = compressionRatio >= 0.1 && compressionRatio <= 0.3 ? 1.0 : 
                     Math.max(0, 1 - Math.abs(compressionRatio - 0.2) * 5);
  
  // Coverage score: based on key terms preservation
  const originalWords = new Set(originalText.toLowerCase().split(/\s+/));
  const summaryWords = new Set(summary.toLowerCase().split(/\s+/));
  const intersection = new Set([...originalWords].filter(x => summaryWords.has(x)));
  const coverageScore = intersection.size / originalWords.size;
  
  // Style score: based on sentence structure and readability
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = summary.length / sentences.length;
  const styleScore = avgSentenceLength >= 50 && avgSentenceLength <= 150 ? 1.0 : 0.7;
  
  // Coherence score: simplified based on transition words and structure
  const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'meanwhile'];
  const hasTransitions = transitionWords.some(word => summary.toLowerCase().includes(word));
  const coherenceScore = hasTransitions ? 0.9 : 0.7;
  
  const overall = (coherenceScore * 0.4 + coverageScore * 0.3 + styleScore * 0.2 + lengthScore * 0.1);
  
  return {
    coherence: Math.round(coherenceScore * 100) / 100,
    coverage: Math.round(coverageScore * 100) / 100,
    style: Math.round(styleScore * 100) / 100,
    length: Math.round(lengthScore * 100) / 100,
    overall: Math.round(overall * 100) / 100
  };
}
