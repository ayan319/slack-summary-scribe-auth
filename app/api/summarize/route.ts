import { NextRequest, NextResponse } from 'next/server';
import { generateDeepSeekSummary } from '@/lib/slack';
import { SentryTracker } from '@/lib/sentry.client';
import { generateAISummary, getDefaultModel, canUseModel, AI_MODELS } from '@/lib/ai-models';
import { getUserSubscription, getUserPlan } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Demo mode - no authentication required
    console.log('📝 Summarize: Demo mode active');

    SentryTracker.addAPIBreadcrumb('POST', '/api/summarize', undefined, {
      userAgent: request.headers.get('user-agent'),
    });

    const body = await request.json();
    const { transcriptText, userId, teamId, context, preferredModel } = body;

    // Validate required fields
    if (!transcriptText) {
      return NextResponse.json(
        { error: 'Missing required field: transcriptText' },
        { status: 400 }
      );
    }

    // Demo user data
    const demoUserId = userId || 'demo-user-123';
    const demoTeamId = teamId || 'demo-team-123';

    // Add summarization breadcrumb
    SentryTracker.addSummarizationBreadcrumb('manual', 'started', undefined, {
      userId: demoUserId,
      teamId: demoTeamId,
      textLength: transcriptText.length,
    });

    // Generate summary using AI
    const startTime = Date.now();

    try {
      // Get user subscription and determine available AI model
      let userPlan = 'FREE'; // Default for demo mode
      let selectedModel = 'deepseek-r1'; // Default model
      let upgradePrompt = null;

      // In production, get actual user subscription
      if (userId && userId !== 'demo-user-123') {
        try {
          const subscription = await getUserSubscription(userId);
          userPlan = getUserPlan(subscription);
        } catch (error) {
          console.warn('Failed to get user subscription, using FREE plan:', error);
        }
      }

      // Determine which AI model to use
      if (preferredModel && canUseModel(userPlan as any, preferredModel)) {
        selectedModel = preferredModel;
      } else {
        selectedModel = getDefaultModel(userPlan as any);

        // If user requested a premium model but doesn't have access, show upgrade prompt
        if (preferredModel && !canUseModel(userPlan as any, preferredModel)) {
          const requestedModel = AI_MODELS[preferredModel];
          upgradePrompt = {
            message: `Upgrade to ${requestedModel?.requiredPlan} plan to use ${requestedModel?.name}`,
            requiredPlan: requestedModel?.requiredPlan,
            modelFeatures: requestedModel?.features || []
          };
        }
      }

      console.log('🤖 Using AI model:', { selectedModel, userPlan, upgradePrompt });

      // Generate summary using the selected AI model
      let summaryResponse;
      if (selectedModel === 'deepseek-r1') {
        // Use existing DeepSeek implementation for backward compatibility
        const summaryText = await generateDeepSeekSummary(transcriptText, context?.source || 'manual');
        summaryResponse = {
          text: summaryText,
          model: selectedModel,
          tokens: { input: Math.ceil(transcriptText.length / 4), output: Math.ceil(summaryText.length / 4) },
          cost: 0,
          processingTime: Date.now() - startTime
        };
      } else {
        // Use new multi-tier AI system
        summaryResponse = await generateAISummary(transcriptText, selectedModel, context?.source);
      }

      const processingTime = Date.now() - startTime;

      SentryTracker.addSummarizationBreadcrumb('manual', 'completed', processingTime, {
        userId: demoUserId,
        textLength: transcriptText.length,
      });

      // Demo mode - simulate database save
      console.log('💾 Summary saved (demo mode):', {
        userId: demoUserId,
        teamId: demoTeamId,
        title: `Summary - ${new Date().toLocaleDateString()}`,
        summaryLength: summaryResponse.text.length,
        aiModel: summaryResponse.model,
        cost: summaryResponse.cost
      });

      const demoSummary = {
        id: 'demo-summary-' + Date.now(),
        user_id: demoUserId,
        team_id: demoTeamId,
        title: `Summary - ${new Date().toLocaleDateString()}`,
        summary_text: summaryResponse.text,
        summary: {
          text: summaryResponse.text,
          skills: [],
          redFlags: [],
          actions: [],
          sentiment: 'neutral',
          urgency: 'medium',
          participants: [],
          speakerCount: 0,
        },
        skills_detected: [],
        red_flags: [],
        actions: [],
        tags: [],
        source: context?.source || 'manual',
        raw_transcript: transcriptText,
        processing_time_ms: summaryResponse.processingTime,
        ai_model: summaryResponse.model,
        quality_score: summaryResponse.qualityScores?.overall || 0.8,
        coherence_score: summaryResponse.qualityScores?.coherence || 0.8,
        coverage_score: summaryResponse.qualityScores?.coverage || 0.8,
        style_score: summaryResponse.qualityScores?.style || 0.8,
        length_score: summaryResponse.qualityScores?.length || 0.8,
        token_count: summaryResponse.tokens.input + summaryResponse.tokens.output,
        cost_usd: summaryResponse.cost,
        confidence_score: summaryResponse.qualityScores?.overall || 0.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      SentryTracker.addDatabaseBreadcrumb('insert', 'summaries', true, {
        summaryId: demoSummary.id,
        userId: demoUserId,
      });

      return NextResponse.json({
        success: true,
        data: demoSummary,
        aiModel: {
          used: summaryResponse.model,
          available: userPlan,
          upgradePrompt
        },
        usage: {
          tokens: summaryResponse.tokens,
          cost: summaryResponse.cost,
          processingTime: summaryResponse.processingTime
        },
        qualityScores: summaryResponse.qualityScores
      });

    } catch (aiError) {
      const processingTime = Date.now() - startTime;

      SentryTracker.addSummarizationBreadcrumb('manual', 'failed', processingTime, {
        error: aiError instanceof Error ? aiError.message : 'Unknown error',
        userId: demoUserId,
      });

      return NextResponse.json(
        { error: 'Failed to generate summary', details: aiError instanceof Error ? aiError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Summarize API error:', error);
    
    SentryTracker.captureException(error as Error, {
      component: 'summarize-api',
      action: 'POST',
      extra: {
        url: request.url,
        method: 'POST',
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
