import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS, canUseModel, getDefaultModel, getPremiumModel } from '@/lib/ai-models';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * GET /api/ai/models
 * Get available AI models for user's subscription plan
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization if not provided
    let orgId = organizationId;
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Get user's subscription plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    const userPlan = subscription?.plan || 'FREE';

    // Get user's AI preferences
    const { data: settings } = await supabase
      .from('user_settings')
      .select('preferred_ai_model')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .single();

    // Filter models based on user's plan
    const availableModels = Object.values(AI_MODELS).filter(model => 
      canUseModel(userPlan, model.id)
    );

    const defaultModel = getDefaultModel(userPlan);
    const preferredModel = settings?.preferred_ai_model || defaultModel;
    const recommendedModel = getPremiumModel(userPlan, preferredModel);

    return NextResponse.json({
      success: true,
      data: {
        user_plan: userPlan,
        available_models: availableModels.map(model => ({
          id: model.id,
          name: model.name,
          provider: model.provider,
          features: model.features,
          description: model.description,
          cost_per_1k_tokens: model.costPer1kTokens,
          max_tokens: model.maxTokens,
          required_plan: model.requiredPlan,
          is_available: canUseModel(userPlan, model.id)
        })),
        current_settings: {
          default_model: defaultModel,
          preferred_model: preferredModel,
          recommended_model: recommendedModel
        },
        plan_benefits: {
          FREE: ['DeepSeek R1', 'Basic summarization', '10 summaries/month'],
          PRO: ['GPT-4o Mini', 'Premium summarization', 'Smart tagging', 'Unlimited summaries'],
          ENTERPRISE: ['GPT-4o', 'Claude 3.5 Sonnet', 'Advanced analysis', 'Priority support']
        }
      }
    });

  } catch (error) {
    console.error('Get AI models API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/models
 * Update user's AI model preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const { 
      preferred_model,
      organization_id 
    } = await request.json();

    if (!preferred_model) {
      return NextResponse.json(
        { error: 'Preferred model is required' },
        { status: 400 }
      );
    }

    // Validate model exists
    if (!AI_MODELS[preferred_model]) {
      return NextResponse.json(
        { error: 'Invalid AI model' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization if not provided
    let orgId = organization_id;
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Get user's subscription plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    const userPlan = subscription?.plan || 'FREE';

    // Check if user can use the preferred model
    if (!canUseModel(userPlan, preferred_model)) {
      return NextResponse.json(
        { 
          error: 'Model not available for your subscription plan',
          required_plan: AI_MODELS[preferred_model].requiredPlan,
          current_plan: userPlan
        },
        { status: 403 }
      );
    }

    // Update user settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        organization_id: orgId,
        preferred_ai_model: preferred_model,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating AI model preference:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'AI model preference updated successfully',
      data: {
        preferred_model: data.preferred_ai_model,
        model_info: AI_MODELS[preferred_model]
      }
    });

  } catch (error) {
    console.error('Update AI model preference API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/models
 * Test AI model with sample text
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      model_id,
      sample_text,
      organization_id 
    } = await request.json();

    if (!model_id || !sample_text) {
      return NextResponse.json(
        { error: 'Model ID and sample text are required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's subscription plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    const userPlan = subscription?.plan || 'FREE';

    // Check if user can use the model
    if (!canUseModel(userPlan, model_id)) {
      return NextResponse.json(
        { 
          error: 'Model not available for your subscription plan',
          required_plan: AI_MODELS[model_id].requiredPlan,
          current_plan: userPlan
        },
        { status: 403 }
      );
    }

    // Import and use the AI generation function
    const { generateAISummary } = await import('@/lib/ai-models');
    
    // Generate sample summary
    const result = await generateAISummary(
      sample_text,
      model_id,
      'This is a test summarization to demonstrate model capabilities.'
    );

    return NextResponse.json({
      success: true,
      data: {
        model_used: result.model,
        summary: result.text,
        tokens_used: result.tokens,
        cost: result.cost,
        processing_time_ms: result.processingTime,
        quality_scores: result.qualityScores
      }
    });

  } catch (error) {
    console.error('Test AI model API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
