'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  step_name: string;
  is_completed: boolean;
  completed_at?: string;
  stepInfo: {
    title: string;
    description: string;
    icon: string;
    estimatedTime: string;
    required: boolean;
    order: number;
  };
}

interface OnboardingProgress {
  total_steps: number;
  completed_steps: number;
  completion_percentage: number;
  status: 'not_started' | 'in_progress' | 'complete';
}

interface OnboardingChecklistProps {
  userId?: string;
  onStepComplete?: (stepName: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export function OnboardingChecklist({ 
  userId = 'demo-user-123', 
  onStepComplete,
  onDismiss,
  className = ''
}: OnboardingChecklistProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchOnboardingData();
  }, [userId]);

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch(`/api/onboarding?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setSteps(data.data.steps);
        setProgress(data.data.progress);
        setCurrentStep(data.data.currentStep);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepName: string, action: 'complete' | 'skip' = 'complete') => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          stepName,
          action,
          stepData: { timestamp: new Date().toISOString() }
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchOnboardingData();
        onStepComplete?.(stepName);
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (loading) {
    return (
      <Card className={`w-full max-w-2xl ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible || !progress || progress.status === 'complete') {
    return null;
  }

  const sortedSteps = steps.sort((a, b) => a.stepInfo.order - b.stepInfo.order);
  const nextSteps = sortedSteps.filter(step => !step.is_completed).slice(0, 3);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`w-full max-w-2xl border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-blue-900">
                  Welcome to Slack Summary Scribe! 🚀
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Complete these steps to get the most out of your AI-powered summaries
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">
                  {progress.completed_steps} of {progress.total_steps} completed
                </span>
                <span className="text-blue-600 font-medium">
                  {progress.completion_percentage}%
                </span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.completion_percentage}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                  step.step_name === currentStep
                    ? 'bg-white border-blue-300 shadow-md'
                    : 'bg-white/50 border-blue-100 hover:bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.is_completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : step.step_name === currentStep ? (
                    <Clock className="h-6 w-6 text-blue-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{step.stepInfo.icon}</span>
                    <h3 className="font-medium text-gray-900 truncate">
                      {step.stepInfo.title}
                    </h3>
                    {step.stepInfo.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {step.stepInfo.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {step.stepInfo.estimatedTime}
                    </Badge>
                    {step.is_completed && step.completed_at && (
                      <span className="text-xs text-green-600">
                        Completed {new Date(step.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {!step.is_completed && (
                  <div className="flex space-x-2">
                    {!step.stepInfo.required && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => completeStep(step.step_name, 'skip')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Skip
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => completeStep(step.step_name, 'complete')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {step.step_name === currentStep ? (
                        <>
                          Start <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        'Complete'
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}

            {progress.completion_percentage > 50 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <h4 className="font-medium text-green-900">Great progress!</h4>
                    <p className="text-sm text-green-700">
                      You're more than halfway through the setup. Keep going!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
