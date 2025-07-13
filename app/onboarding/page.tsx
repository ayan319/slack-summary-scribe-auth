'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from '@/components/OnboardingFlow';
import { trackOnboardingEvent } from '@/lib/analytics';

export default function OnboardingPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Track onboarding started
    trackOnboardingEvent('demo-user', 'started');
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      // Track onboarding completion
      await trackOnboardingEvent('demo-user', 'completed');
      
      // Mark onboarding as completed in localStorage
      localStorage.setItem('onboarding_completed', 'true');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.push('/dashboard');
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      // Track onboarding skipped
      await trackOnboardingEvent('demo-user', 'skipped');
      
      // Mark onboarding as skipped in localStorage
      localStorage.setItem('onboarding_completed', 'skipped');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      router.push('/dashboard');
    }
  };

  if (!showOnboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
}
