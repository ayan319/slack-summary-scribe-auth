import { supabaseAdmin } from './supabase';
import { generateAISummary, AI_MODELS } from './ai-models';

export interface QualityScores {
  coherence: number;
  coverage: number;
  style: number;
  length: number;
  overall: number;
}

export interface ModelComparison {
  id: string;
  user_id: string;
  original_text: string;
  deepseek_summary?: string;
  gpt4_summary?: string;
  claude_summary?: string;
  deepseek_score?: number;
  gpt4_score?: number;
  claude_score?: number;
  user_preferred_model?: 'deepseek' | 'gpt4' | 'claude';
  comparison_metadata: Record<string, any>;
  created_at: string;
}

export interface ScoringMetrics {
  readability: number;
  informativeness: number;
  conciseness: number;
  accuracy: number;
  engagement: number;
}

// Advanced quality scoring algorithm
export async function calculateAdvancedQualityScores(
  originalText: string,
  summary: string,
  context?: string
): Promise<QualityScores> {
  try {
    // Text analysis metrics
    const originalWords = originalText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const summaryWords = summary.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const originalSentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summarySentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // 1. Coherence Score (0-1)
    const coherenceScore = calculateCoherenceScore(summary, summarySentences);

    // 2. Coverage Score (0-1) - How well the summary covers the original content
    const coverageScore = calculateCoverageScore(originalWords, summaryWords, originalText, summary);

    // 3. Style Score (0-1) - Writing quality and readability
    const styleScore = calculateStyleScore(summary, summarySentences, summaryWords);

    // 4. Length Score (0-1) - Appropriate compression ratio
    const lengthScore = calculateLengthScore(originalWords.length, summaryWords.length);

    // 5. Overall Score (weighted average)
    const overall = (
      coherenceScore * 0.3 +
      coverageScore * 0.3 +
      styleScore * 0.25 +
      lengthScore * 0.15
    );

    return {
      coherence: Math.round(coherenceScore * 100) / 100,
      coverage: Math.round(coverageScore * 100) / 100,
      style: Math.round(styleScore * 100) / 100,
      length: Math.round(lengthScore * 100) / 100,
      overall: Math.round(overall * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating quality scores:', error);
    // Return default scores on error
    return {
      coherence: 0.7,
      coverage: 0.7,
      style: 0.7,
      length: 0.7,
      overall: 0.7
    };
  }
}

function calculateCoherenceScore(summary: string, sentences: string[]): number {
  // Check for transition words and logical flow
  const transitionWords = [
    'however', 'therefore', 'furthermore', 'additionally', 'meanwhile',
    'consequently', 'moreover', 'nevertheless', 'thus', 'hence',
    'first', 'second', 'finally', 'in conclusion', 'as a result'
  ];

  const hasTransitions = transitionWords.some(word => 
    summary.toLowerCase().includes(word)
  );

  // Check sentence length variation (good coherence has varied sentence lengths)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const hasVariation = variance > 10; // Good variation in sentence lengths

  // Check for proper structure (introduction, body, conclusion indicators)
  const hasStructure = summary.includes(':') || summary.includes('•') || summary.includes('-');

  let score = 0.5; // Base score
  if (hasTransitions) score += 0.2;
  if (hasVariation) score += 0.2;
  if (hasStructure) score += 0.1;

  return Math.min(1.0, score);
}

function calculateCoverageScore(
  originalWords: string[],
  summaryWords: string[],
  originalText: string,
  summary: string
): number {
  // Key term preservation
  const originalWordSet = new Set(originalWords.filter(w => w.length > 3)); // Filter short words
  const summaryWordSet = new Set(summaryWords.filter(w => w.length > 3));
  const intersection = new Set([...originalWordSet].filter(x => summaryWordSet.has(x)));
  const keyTermPreservation = intersection.size / Math.min(originalWordSet.size, 50); // Cap at 50 key terms

  // Topic coverage (simple keyword density analysis)
  const importantWords = extractImportantWords(originalText);
  const coveredImportantWords = importantWords.filter(word => 
    summary.toLowerCase().includes(word.toLowerCase())
  );
  const topicCoverage = coveredImportantWords.length / Math.max(importantWords.length, 1);

  // Information density
  const informationDensity = Math.min(1.0, summaryWords.length / (originalWords.length * 0.3));

  return (keyTermPreservation * 0.4 + topicCoverage * 0.4 + informationDensity * 0.2);
}

function calculateStyleScore(summary: string, sentences: string[], words: string[]): number {
  // Average sentence length (ideal: 15-25 words)
  const avgSentenceLength = words.length / sentences.length;
  const lengthScore = avgSentenceLength >= 10 && avgSentenceLength <= 30 ? 1.0 : 
                     Math.max(0.3, 1 - Math.abs(avgSentenceLength - 20) / 20);

  // Readability indicators
  const hasActiveVoice = !summary.toLowerCase().includes(' was ') && 
                        !summary.toLowerCase().includes(' were ');
  const hasStrongVerbs = /\b(achieved|implemented|developed|created|established|improved)\b/i.test(summary);
  const hasSpecificDetails = /\b(\d+%|\d+ \w+|specific|particular|detailed)\b/i.test(summary);

  // Grammar and punctuation
  const properPunctuation = summary.includes('.') && !summary.endsWith(',');
  const properCapitalization = /^[A-Z]/.test(summary);

  let styleScore = lengthScore * 0.4;
  if (hasActiveVoice) styleScore += 0.15;
  if (hasStrongVerbs) styleScore += 0.15;
  if (hasSpecificDetails) styleScore += 0.15;
  if (properPunctuation) styleScore += 0.075;
  if (properCapitalization) styleScore += 0.075;

  return Math.min(1.0, styleScore);
}

function calculateLengthScore(originalWordCount: number, summaryWordCount: number): number {
  const compressionRatio = summaryWordCount / originalWordCount;
  
  // Ideal compression ratio: 10-30% of original
  if (compressionRatio >= 0.1 && compressionRatio <= 0.3) {
    return 1.0;
  } else if (compressionRatio >= 0.05 && compressionRatio <= 0.5) {
    return 0.8;
  } else {
    return Math.max(0.3, 1 - Math.abs(compressionRatio - 0.2) * 2);
  }
}

function extractImportantWords(text: string): string[] {
  // Simple keyword extraction (in production, use more sophisticated NLP)
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Model comparison functionality
export async function compareAIModels(
  userId: string,
  originalText: string,
  models: string[] = ['deepseek-r1', 'gpt-4o', 'claude-3-5-sonnet']
): Promise<ModelComparison> {
  try {
    const summaries: Record<string, { text: string; score: number }> = {};
    
    // Generate summaries with different models
    for (const modelId of models) {
      try {
        const result = await generateAISummary(originalText, modelId);
        const scores = await calculateAdvancedQualityScores(originalText, result.text);
        summaries[modelId] = {
          text: result.text,
          score: scores.overall
        };
      } catch (error) {
        console.warn(`Failed to generate summary with ${modelId}:`, error);
      }
    }

    // Store comparison in database
    const comparisonData = {
      user_id: userId,
      original_text: originalText.substring(0, 5000), // Limit text length
      deepseek_summary: summaries['deepseek-r1']?.text,
      gpt4_summary: summaries['gpt-4o']?.text,
      claude_summary: summaries['claude-3-5-sonnet']?.text,
      deepseek_score: summaries['deepseek-r1']?.score,
      gpt4_score: summaries['gpt-4o']?.score,
      claude_score: summaries['claude-3-5-sonnet']?.score,
      comparison_metadata: {
        models_tested: models,
        test_timestamp: new Date().toISOString(),
        text_length: originalText.length
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await (supabaseAdmin as any)
      .from('ai_model_comparisons')
      .insert(comparisonData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store model comparison: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error comparing AI models:', error);
    throw error;
  }
}

// Get user's model preferences based on past comparisons
export async function getUserModelPreferences(userId: string): Promise<{
  preferredModel: string;
  modelScores: Record<string, number>;
  totalComparisons: number;
}> {
  try {
    const { data: comparisons, error } = await (supabaseAdmin as any)
      .from('ai_model_comparisons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to get model preferences: ${error.message}`);
    }

    if (!comparisons || comparisons.length === 0) {
      return {
        preferredModel: 'deepseek-r1',
        modelScores: {},
        totalComparisons: 0
      };
    }

    // Calculate average scores for each model
    const modelScores: Record<string, { total: number; count: number }> = {};
    
    (comparisons || []).forEach((comp: any) => {
      if (comp.deepseek_score) {
        if (!modelScores['deepseek-r1']) modelScores['deepseek-r1'] = { total: 0, count: 0 };
        modelScores['deepseek-r1'].total += comp.deepseek_score;
        modelScores['deepseek-r1'].count += 1;
      }
      if (comp.gpt4_score) {
        if (!modelScores['gpt-4o']) modelScores['gpt-4o'] = { total: 0, count: 0 };
        modelScores['gpt-4o'].total += comp.gpt4_score;
        modelScores['gpt-4o'].count += 1;
      }
      if (comp.claude_score) {
        if (!modelScores['claude-3-5-sonnet']) modelScores['claude-3-5-sonnet'] = { total: 0, count: 0 };
        modelScores['claude-3-5-sonnet'].total += comp.claude_score;
        modelScores['claude-3-5-sonnet'].count += 1;
      }
    });

    // Calculate averages and find preferred model
    const avgScores: Record<string, number> = {};
    let preferredModel = 'deepseek-r1';
    let highestScore = 0;

    Object.entries(modelScores).forEach(([model, { total, count }]) => {
      const avg = total / count;
      avgScores[model] = Math.round(avg * 100) / 100;
      
      if (avg > highestScore) {
        highestScore = avg;
        preferredModel = model;
      }
    });

    return {
      preferredModel,
      modelScores: avgScores,
      totalComparisons: comparisons.length
    };
  } catch (error) {
    console.error('Error getting model preferences:', error);
    return {
      preferredModel: 'deepseek-r1',
      modelScores: {},
      totalComparisons: 0
    };
  }
}

// Update user's preferred model based on feedback
export async function updateUserModelPreference(
  userId: string,
  comparisonId: string,
  preferredModel: 'deepseek' | 'gpt4' | 'claude'
): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin as any)
      .from('ai_model_comparisons')
      .update({ user_preferred_model: preferredModel })
      .eq('id', comparisonId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update model preference: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating model preference:', error);
    return false;
  }
}
