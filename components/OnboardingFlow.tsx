'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, Circle, ArrowRight, ArrowLeft, 
  MessageSquare, Upload, FileText, Settings, 
  Zap, Users, Crown, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState({
    name: '',
    role: '',
    teamSize: '',
    useCase: ''
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Slack Summary Scribe',
      description: 'Let\'s get you set up in just a few minutes',
      icon: Crown,
      component: WelcomeStep,
      completed: false
    },
    {
      id: 'profile',
      title: 'Tell us about yourself',
      description: 'Help us personalize your experience',
      icon: Users,
      component: ProfileStep,
      completed: false
    },
    {
      id: 'slack-connect',
      title: 'Connect your Slack workspace',
      description: 'Securely link your Slack for AI summaries',
      icon: MessageSquare,
      component: SlackConnectStep,
      completed: false
    },
    {
      id: 'first-upload',
      title: 'Upload your first document',
      description: 'Try our AI-powered document summarization',
      icon: Upload,
      component: FirstUploadStep,
      completed: false,
      optional: true
    },
    {
      id: 'features',
      title: 'Explore key features',
      description: 'Discover what makes us powerful',
      icon: Zap,
      component: FeaturesStep,
      completed: false
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Start creating amazing summaries',
      icon: CheckCircle,
      component: CompleteStep,
      completed: false
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      markStepCompleted(steps[currentStep].id);
      setCurrentStep(currentStep + 1);
    } else {
      markStepCompleted(steps[currentStep].id);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    if (steps[currentStep].optional) {
      handleNext();
    }
  };

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Getting Started</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="bg-white/20" />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = index === currentStep;
              const isAccessible = index <= currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isAccessible
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span>{step.title}</span>
                  {step.optional && (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {React.createElement(steps[currentStep].component, {
                userProfile,
                setUserProfile,
                onNext: handleNext,
                onComplete: markStepCompleted
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            {steps[currentStep].optional && (
              <Button
                variant="ghost"
                onClick={handleSkipStep}
              >
                Skip this step
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>{currentStep === steps.length - 1 ? 'Complete' : 'Next'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Individual step components
function WelcomeStep({ onNext }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
        <Crown className="h-10 w-10 text-white" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">Welcome to Slack Summary Scribe!</h3>
        <p className="text-gray-600 text-lg">
          Transform your team communication with AI-powered summaries. 
          Let's get you set up in just a few minutes.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-semibold">Connect Slack</h4>
          <p className="text-sm text-gray-600">Link your workspace securely</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-semibold">AI Analysis</h4>
          <p className="text-sm text-gray-600">Get intelligent summaries</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-semibold">Export & Share</h4>
          <p className="text-sm text-gray-600">Multiple export options</p>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({ userProfile, setUserProfile }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Tell us about yourself</h3>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <input
            type="text"
            value={userProfile.name}
            onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Your Role</label>
          <select
            value={userProfile.role}
            onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select your role</option>
            <option value="manager">Manager</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="product">Product Manager</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Team Size</label>
          <select
            value={userProfile.teamSize}
            onChange={(e) => setUserProfile({...userProfile, teamSize: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select team size</option>
            <option value="1-5">1-5 people</option>
            <option value="6-20">6-20 people</option>
            <option value="21-50">21-50 people</option>
            <option value="50+">50+ people</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Primary Use Case</label>
          <select
            value={userProfile.useCase}
            onChange={(e) => setUserProfile({...userProfile, useCase: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select use case</option>
            <option value="meetings">Meeting summaries</option>
            <option value="decisions">Decision tracking</option>
            <option value="updates">Team updates</option>
            <option value="knowledge">Knowledge management</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function SlackConnectStep() {
  return (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Connect your Slack workspace</h3>
        <p className="text-gray-600">Securely link your Slack to start getting AI summaries</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h4 className="font-semibold mb-2">Secure OAuth Integration</h4>
        <p className="text-sm text-gray-600 mb-4">
          We use Slack's official OAuth to securely access your workspace. 
          We only read messages you explicitly share with our app.
        </p>
        <Button className="w-full">
          Connect Slack Workspace
        </Button>
      </div>
      
      <div className="text-xs text-gray-500">
        <p>🔒 Your data is encrypted and secure</p>
        <p>📝 We only access channels you authorize</p>
        <p>🚫 We never store your messages permanently</p>
      </div>
    </div>
  );
}

function FirstUploadStep() {
  return (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Try document summarization</h3>
        <p className="text-gray-600">Upload a document to see our AI in action (optional)</p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Drag and drop a file here, or click to browse</p>
        <p className="text-sm text-gray-500">Supports PDF, DOCX files up to 10MB</p>
        <Button variant="outline" className="mt-4">
          Choose File
        </Button>
      </div>
    </div>
  );
}

function FeaturesStep() {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Summaries',
      description: 'Get intelligent summaries of your Slack conversations'
    },
    {
      icon: FileText,
      title: 'Multiple Export Options',
      description: 'Export to PDF, Notion, or your favorite tools'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share summaries with your team members'
    },
    {
      icon: Settings,
      title: 'Customizable Settings',
      description: 'Configure AI models and summary preferences'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Explore key features</h3>
        <p className="text-gray-600">Discover what makes Slack Summary Scribe powerful</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <Icon className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">You're all set!</h3>
        <p className="text-gray-600 text-lg">
          Welcome to Slack Summary Scribe. You're ready to start creating amazing summaries.
        </p>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold mb-2">What's next?</h4>
        <ul className="text-sm text-gray-600 space-y-1 text-left">
          <li>• Connect your Slack workspace to start getting summaries</li>
          <li>• Upload documents to try our AI summarization</li>
          <li>• Explore export options to share with your team</li>
          <li>• Check out our help center for tips and tricks</li>
        </ul>
      </div>
    </div>
  );
}
