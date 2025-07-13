import { supabaseAdmin, supabase } from './supabase';

export type OnboardingStep = 
  | 'welcome'
  | 'connect_slack'
  | 'upload_first_file'
  | 'generate_first_summary'
  | 'explore_dashboard'
  | 'setup_notifications'
  | 'connect_crm'
  | 'complete';

export interface OnboardingStepData {
  id: string;
  user_id: string;
  step_name: OnboardingStep;
  is_completed: boolean;
  completed_at?: string;
  step_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  user_id: string;
  total_steps: number;
  completed_steps: number;
  completion_percentage: number;
  status: 'not_started' | 'in_progress' | 'complete';
}

export const ONBOARDING_STEPS: Record<OnboardingStep, {
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  required: boolean;
  order: number;
}> = {
  welcome: {
    title: 'Welcome to Slack Summary Scribe',
    description: 'Learn about the key features and benefits',
    icon: '👋',
    estimatedTime: '2 min',
    required: true,
    order: 1
  },
  connect_slack: {
    title: 'Connect Your Slack Workspace',
    description: 'Authorize access to your Slack workspace for automatic summaries',
    icon: '💬',
    estimatedTime: '3 min',
    required: true,
    order: 2
  },
  upload_first_file: {
    title: 'Upload Your First File',
    description: 'Try uploading a PDF or DOCX file for AI summarization',
    icon: '📄',
    estimatedTime: '2 min',
    required: false,
    order: 3
  },
  generate_first_summary: {
    title: 'Generate Your First Summary',
    description: 'Create your first AI-powered summary from Slack or uploaded content',
    icon: '🤖',
    estimatedTime: '3 min',
    required: true,
    order: 4
  },
  explore_dashboard: {
    title: 'Explore the Dashboard',
    description: 'Discover analytics, search, and management features',
    icon: '📊',
    estimatedTime: '5 min',
    required: false,
    order: 5
  },
  setup_notifications: {
    title: 'Setup Notifications',
    description: 'Configure email and Slack notifications for new summaries',
    icon: '🔔',
    estimatedTime: '2 min',
    required: false,
    order: 6
  },
  connect_crm: {
    title: 'Connect Your CRM',
    description: 'Integrate with HubSpot, Salesforce, or Pipedrive for seamless exports',
    icon: '🔗',
    estimatedTime: '5 min',
    required: false,
    order: 7
  },
  complete: {
    title: 'Onboarding Complete',
    description: 'You\'re all set! Start creating amazing summaries',
    icon: '🎉',
    estimatedTime: '1 min',
    required: true,
    order: 8
  }
};

export async function getUserOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Failed to get onboarding progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return null;
  }
}

export async function getUserOnboardingSteps(userId: string): Promise<OnboardingStepData[]> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('onboarding_steps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get onboarding steps: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting onboarding steps:', error);
    return [];
  }
}

export async function completeOnboardingStep(
  userId: string,
  stepName: OnboardingStep,
  stepData: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin as any).rpc('complete_onboarding_step', {
      p_user_id: userId,
      p_step_name: stepName,
      p_step_data: stepData
    });

    if (error) {
      console.error('Failed to complete onboarding step:', error);
      return false;
    }

    console.log('✅ Onboarding step completed:', { userId, stepName, stepData });
    return true;
  } catch (error) {
    console.error('Error completing onboarding step:', error);
    return false;
  }
}

export async function initializeUserOnboarding(userId: string): Promise<boolean> {
  try {
    // Check if onboarding already exists
    const existingSteps = await getUserOnboardingSteps(userId);
    if (existingSteps.length > 0) {
      console.log('Onboarding already initialized for user:', userId);
      return true;
    }

    // Initialize all onboarding steps
    const steps = Object.keys(ONBOARDING_STEPS) as OnboardingStep[];
    const { error } = await (supabaseAdmin as any)
      .from('onboarding_steps')
      .insert(
        steps.map(stepName => ({
          user_id: userId,
          step_name: stepName,
          is_completed: false,
          step_data: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );

    if (error) {
      console.error('Failed to initialize onboarding:', error);
      return false;
    }

    console.log('✅ Onboarding initialized for user:', userId);
    return true;
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    return false;
  }
}

export function getNextOnboardingStep(steps: OnboardingStepData[]): OnboardingStep | null {
  const sortedSteps = Object.entries(ONBOARDING_STEPS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([stepName]) => stepName as OnboardingStep);

  for (const stepName of sortedSteps) {
    const step = steps.find(s => s.step_name === stepName);
    if (!step || !step.is_completed) {
      return stepName;
    }
  }

  return null; // All steps completed
}

export function getOnboardingStepProgress(steps: OnboardingStepData[]): {
  current: OnboardingStep | null;
  completed: number;
  total: number;
  percentage: number;
} {
  const totalSteps = Object.keys(ONBOARDING_STEPS).length;
  const completedSteps = steps.filter(step => step.is_completed).length;
  const currentStep = getNextOnboardingStep(steps);

  return {
    current: currentStep,
    completed: completedSteps,
    total: totalSteps,
    percentage: Math.round((completedSteps / totalSteps) * 100)
  };
}

export function shouldShowOnboarding(progress: OnboardingProgress | null): boolean {
  if (!progress) return true;
  return progress.status !== 'complete' && progress.completion_percentage < 100;
}

export async function skipOnboardingStep(
  userId: string,
  stepName: OnboardingStep
): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin as any)
      .from('onboarding_steps')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        step_data: { skipped: true },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('step_name', stepName);

    if (error) {
      console.error('Failed to skip onboarding step:', error);
      return false;
    }

    console.log('⏭️ Onboarding step skipped:', { userId, stepName });
    return true;
  } catch (error) {
    console.error('Error skipping onboarding step:', error);
    return false;
  }
}

export async function resetUserOnboarding(userId: string): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin as any)
      .from('onboarding_steps')
      .update({
        is_completed: false,
        completed_at: null,
        step_data: {},
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to reset onboarding:', error);
      return false;
    }

    console.log('🔄 Onboarding reset for user:', userId);
    return true;
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return false;
  }
}

// Auto-complete steps based on user actions
export async function autoCompleteOnboardingStep(
  userId: string,
  action: 'slack_connected' | 'file_uploaded' | 'summary_generated' | 'dashboard_visited' | 'notifications_setup' | 'crm_connected'
): Promise<void> {
  const stepMapping: Record<typeof action, OnboardingStep> = {
    slack_connected: 'connect_slack',
    file_uploaded: 'upload_first_file',
    summary_generated: 'generate_first_summary',
    dashboard_visited: 'explore_dashboard',
    notifications_setup: 'setup_notifications',
    crm_connected: 'connect_crm'
  };

  const stepName = stepMapping[action];
  if (stepName) {
    await completeOnboardingStep(userId, stepName, { auto_completed: true, action });
  }
}

// Get onboarding analytics
export async function getOnboardingAnalytics(): Promise<{
  totalUsers: number;
  completedOnboarding: number;
  averageCompletionRate: number;
  stepCompletionRates: Record<OnboardingStep, number>;
}> {
  try {
    // Get total users with onboarding
    const { count: totalUsers } = await (supabaseAdmin as any)
      .from('onboarding_steps')
      .select('user_id', { count: 'exact', head: true })
      .eq('step_name', 'welcome');

    // Get users who completed onboarding
    const { count: completedUsers } = await (supabaseAdmin as any)
      .from('onboarding_progress')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'complete');

    // Get step completion rates
    const stepCompletionRates: Record<OnboardingStep, number> = {} as any;
    
    for (const stepName of Object.keys(ONBOARDING_STEPS) as OnboardingStep[]) {
      const { count: completedStep } = await (supabaseAdmin as any)
        .from('onboarding_steps')
        .select('user_id', { count: 'exact', head: true })
        .eq('step_name', stepName)
        .eq('is_completed', true);

      stepCompletionRates[stepName] = totalUsers ? Math.round((completedStep || 0) / totalUsers * 100) : 0;
    }

    return {
      totalUsers: totalUsers || 0,
      completedOnboarding: completedUsers || 0,
      averageCompletionRate: totalUsers ? Math.round((completedUsers || 0) / totalUsers * 100) : 0,
      stepCompletionRates
    };
  } catch (error) {
    console.error('Error getting onboarding analytics:', error);
    return {
      totalUsers: 0,
      completedOnboarding: 0,
      averageCompletionRate: 0,
      stepCompletionRates: {} as any
    };
  }
}
