'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Slack, 
  Crown, 
  FileText, 
  Upload, 
  Settings, 
  Users,
  Zap,
  ExternalLink,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionCard {
  id: string;
  type: 'onboarding' | 'upgrade' | 'integration' | 'feature' | 'optimization';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  progress?: number;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon: React.ReactNode;
  completed?: boolean;
  dismissible?: boolean;
}

interface SmartActionCardsProps {
  cards: ActionCard[];
  onCardAction?: (cardId: string, action: string) => void;
  onDismiss?: (cardId: string) => void;
}

export function SmartActionCards({ 
  cards, 
  onCardAction, 
  onDismiss 
}: SmartActionCardsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const handleCardAction = (card: ActionCard) => {
    if (card.action.onClick) {
      card.action.onClick();
    } else if (card.action.href) {
      window.open(card.action.href, '_blank');
    }
    
    if (onCardAction) {
      onCardAction(card.id, 'action');
    }
  };

  const handleDismiss = (cardId: string) => {
    if (onDismiss) {
      onDismiss(cardId);
    }
  };

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h4 className="text-sm font-medium text-gray-700 mb-2">All caught up!</h4>
          <p className="text-xs text-gray-500">
            No action items at the moment. Great job!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className={`${getPriorityColor(card.priority)} border-2 ${card.completed ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${card.completed ? 'bg-green-100' : 'bg-white'} border`}>
                    {card.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      card.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <span>{card.title}</span>
                      {card.completed && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Completed
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getPriorityBadge(card.priority)}
                  {card.dismissible && !card.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(card.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
              
              {card.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{card.progress}%</span>
                  </div>
                  <Progress value={card.progress} className="h-2" />
                </div>
              )}
            </CardHeader>

            {!card.completed && (
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleCardAction(card)}
                  className="w-full"
                  variant={card.priority === 'high' ? 'default' : 'outline'}
                >
                  {card.action.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Predefined action cards for common scenarios
export const getDefaultActionCards = (userPlan: string, slackConnected: boolean, onboardingProgress: number): ActionCard[] => {
  const cards: ActionCard[] = [];

  // Onboarding cards
  if (onboardingProgress < 100) {
    cards.push({
      id: 'complete-onboarding',
      type: 'onboarding',
      title: 'Complete Your Setup',
      description: 'Finish setting up your account to unlock all features and get the most out of Slack Summary Scribe.',
      priority: 'high',
      progress: onboardingProgress,
      action: {
        label: 'Continue Setup',
        href: '/onboarding'
      },
      icon: <Target className="h-5 w-5 text-blue-600" />,
      dismissible: false
    });
  }

  // Slack connection
  if (!slackConnected) {
    cards.push({
      id: 'connect-slack',
      type: 'integration',
      title: 'Connect Your Slack Workspace',
      description: 'Connect Slack to start generating AI-powered summaries from your team conversations.',
      priority: 'high',
      action: {
        label: 'Connect Slack',
        href: '/slack/connect'
      },
      icon: <Slack className="h-5 w-5 text-purple-600" />,
      dismissible: false
    });
  }

  // Upgrade prompts for free users
  if (userPlan === 'FREE') {
    cards.push({
      id: 'upgrade-to-pro',
      type: 'upgrade',
      title: 'Unlock Premium AI Models',
      description: 'Upgrade to Pro for access to GPT-4o and Claude 3.5 Sonnet for superior summary quality.',
      priority: 'medium',
      action: {
        label: 'Upgrade to Pro',
        href: '/pricing'
      },
      icon: <Crown className="h-5 w-5 text-yellow-600" />,
      dismissible: true
    });
  }

  // Feature discovery
  cards.push({
    id: 'try-file-upload',
    type: 'feature',
    title: 'Try File Upload Summarization',
    description: 'Upload PDFs, Word docs, or text files to get instant AI-powered summaries.',
    priority: 'low',
    action: {
      label: 'Upload a File',
      href: '/upload'
    },
    icon: <Upload className="h-5 w-5 text-green-600" />,
    dismissible: true
  });

  // Optimization suggestions
  if (slackConnected) {
    cards.push({
      id: 'optimize-settings',
      type: 'optimization',
      title: 'Optimize Your AI Settings',
      description: 'Fine-tune your AI preferences and notification settings for better results.',
      priority: 'low',
      action: {
        label: 'Review Settings',
        href: '/dashboard/settings'
      },
      icon: <Settings className="h-5 w-5 text-gray-600" />,
      dismissible: true
    });
  }

  return cards;
};

// Usage insights cards
export const getInsightCards = (insights: any[]): ActionCard[] => {
  return insights.map((insight, index) => ({
    id: `insight-${index}`,
    type: 'optimization',
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
    action: {
      label: insight.action,
      onClick: () => {
        // Handle insight action
        console.log('Insight action:', insight);
      }
    },
    icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
    dismissible: true
  }));
};
