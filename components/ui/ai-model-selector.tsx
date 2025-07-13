'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  Crown, 
  Star, 
  TrendingUp, 
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  features: string[];
  requiredPlan: 'FREE' | 'PRO' | 'ENTERPRISE';
  costPer1kTokens: number;
  maxTokens: number;
  qualityScore?: number;
}

interface AIModelSelectorProps {
  userPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  selectedModel?: string;
  onModelSelect?: (modelId: string) => void;
  onUpgradeClick?: (requiredPlan: string) => void;
  showComparison?: boolean;
  className?: string;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    description: 'Fast and efficient AI model for basic summarization tasks',
    features: ['Basic summarization', 'Fast processing', 'Free tier', 'Good for simple content'],
    requiredPlan: 'FREE',
    costPer1kTokens: 0.0,
    maxTokens: 4000,
    qualityScore: 0.76
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI\'s most capable model with superior reasoning and analysis',
    features: ['Advanced reasoning', 'Better context understanding', 'Premium quality', 'Complex analysis'],
    requiredPlan: 'PRO',
    costPer1kTokens: 0.03,
    maxTokens: 8000,
    qualityScore: 0.85
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Anthropic\'s most advanced model with exceptional writing and analysis capabilities',
    features: ['Excellent writing quality', 'Nuanced analysis', 'Premium insights', 'Creative thinking'],
    requiredPlan: 'PRO',
    costPer1kTokens: 0.03,
    maxTokens: 8000,
    qualityScore: 0.82
  },
  {
    id: 'gpt-4o-enterprise',
    name: 'GPT-4o Enterprise',
    provider: 'OpenAI',
    description: 'Enterprise-grade GPT-4o with extended context and priority processing',
    features: ['Extended context', 'Priority processing', 'Custom fine-tuning', 'Enterprise support'],
    requiredPlan: 'ENTERPRISE',
    costPer1kTokens: 0.03,
    maxTokens: 16000,
    qualityScore: 0.88
  }
];

export function AIModelSelector({
  userPlan = 'FREE',
  selectedModel = 'deepseek-r1',
  onModelSelect,
  onUpgradeClick,
  showComparison = false,
  className = ''
}: AIModelSelectorProps) {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showComparison) {
      fetchPreferences();
    }
  }, [showComparison]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/compare');
      const data = await response.json();
      if (data.success) {
        setPreferences(data.data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch AI preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const canUseModel = (model: AIModel): boolean => {
    const planHierarchy = { 'FREE': 0, 'PRO': 1, 'ENTERPRISE': 2 };
    return planHierarchy[userPlan] >= planHierarchy[model.requiredPlan];
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'PRO':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'ENTERPRISE':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300';
      case 'PRO':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300';
      case 'ENTERPRISE':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getQualityStars = (score: number) => {
    const stars = Math.round(score * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>AI Model Selection</span>
        </CardTitle>
        <CardDescription>
          Choose the AI model that best fits your needs and plan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {showComparison && preferences && (
          <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Your AI Usage Insights</div>
              <div className="text-sm mt-1">
                Preferred model: <strong>{preferences.preferredModel}</strong> • 
                Total comparisons: <strong>{preferences.totalComparisons}</strong>
                {preferences.modelScores[preferences.preferredModel] && (
                  <span> • Average quality: <strong>{(preferences.modelScores[preferences.preferredModel] * 100).toFixed(0)}%</strong></span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {AI_MODELS.map((model, index) => {
            const canUse = canUseModel(model);
            const isSelected = selectedModel === model.id;
            const userScore = preferences?.modelScores?.[model.id];
            
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : canUse 
                      ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm' 
                      : 'border-gray-100 bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-lg">{model.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {model.provider}
                      </Badge>
                      <Badge className={`text-xs ${getPlanColor(model.requiredPlan)}`}>
                        {getPlanIcon(model.requiredPlan)}
                        <span className="ml-1">{model.requiredPlan}</span>
                      </Badge>
                      {model.qualityScore && (
                        <div className="flex items-center space-x-1">
                          {getQualityStars(model.qualityScore)}
                          <span className="text-xs text-gray-600 ml-1">
                            {(model.qualityScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.features.map(feature => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{model.maxTokens.toLocaleString()} tokens</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {model.costPer1kTokens === 0 ? 'Free' : `$${model.costPer1kTokens}/1k tokens`}
                        </span>
                      </div>
                      {userScore && (
                        <div className="flex items-center space-x-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Your avg: {(userScore * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {canUse ? (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onModelSelect?.(model.id)}
                        className="min-w-[80px]"
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpgradeClick?.(model.requiredPlan)}
                        className="min-w-[80px]"
                      >
                        Upgrade
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>

                {!canUse && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Crown className="h-4 w-4" />
                      <span>
                        Upgrade to <strong>{model.requiredPlan}</strong> plan to unlock this model
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {userPlan === 'FREE' && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Unlock Premium AI Models</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Upgrade to Pro or Enterprise to access GPT-4o and Claude 3.5 Sonnet for 
                  superior summary quality, advanced reasoning, and better insights.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-purple-600 hover:bg-purple-700"
                  onClick={() => onUpgradeClick?.('PRO')}
                >
                  Upgrade Now
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
