import { NextRequest, NextResponse } from 'next/server';
import { 
  compareAIModels,
  getUserModelPreferences,
  updateUserModelPreference,
  calculateAdvancedQualityScores
} from '@/lib/ai-scoring';

// Compare AI models for a given text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      text,
      userId = 'demo-user-123',
      models = ['deepseek-r1', 'gpt-4o', 'claude-3-5-sonnet']
    } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    if (text.length < 100) {
      return NextResponse.json(
        { error: 'Text must be at least 100 characters long for meaningful comparison' },
        { status: 400 }
      );
    }

    console.log('🔬 AI Model Comparison Request:', {
      userId,
      textLength: text.length,
      models
    });

    // Validate user authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Continue with the rest of the logic
    return NextResponse.json(
      { message: 'AI compare endpoint - implementation needed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI compare error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
