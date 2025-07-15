'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Crown, 
  Sparkles, 
  Brain, 
  Zap,
  Star,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumAIBadgeProps {
  model: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

const MODEL_CONFIG = {
  'deepseek-r1': {
    name: 'DeepSeek R1',
    tier: 'FREE',
    icon: Zap,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Fast and efficient AI model for basic summarization'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    tier: 'PRO',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Premium AI model with enhanced analysis and smart tagging'
  },
  'gpt-4o': {
    name: 'GPT-4o',
    tier: 'ENTERPRISE',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Most advanced AI model with superior reasoning capabilities'
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    tier: 'ENTERPRISE',
    icon: Shield,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Anthropic\'s most advanced model with exceptional writing quality'
  }
};

const PLAN_COLORS = {
  FREE: 'bg-gray-100 text-gray-800 border-gray-200',
  PRO: 'bg-purple-100 text-purple-800 border-purple-200',
  ENTERPRISE: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

export function PremiumAIBadge({ 
  model, 
  plan, 
  showTooltip = true, 
  size = 'md',
  variant = 'default',
  className = '' 
}: PremiumAIBadgeProps) {
  // Extract model name from fallback format (e.g., "deepseek-r1 (fallback from gpt-4o-mini)")
  const actualModel = model.includes('(fallback from') 
    ? model.split(' (fallback from')[0] 
    : model;
  
  const isFallback = model.includes('(fallback from');
  const originalModel = isFallback 
    ? model.split('(fallback from ')[1]?.replace(')', '') 
    : null;

  const modelConfig = MODEL_CONFIG[actualModel as keyof typeof MODEL_CONFIG] || {
    name: actualModel,
    tier: 'FREE',
    icon: Brain,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'AI model'
  };

  const Icon = modelConfig.icon;
  const isPremium = modelConfig.tier !== 'FREE';

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badgeContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        variant={variant}
        className={`
          ${modelConfig.color} 
          ${sizeClasses[size]} 
          flex items-center space-x-1 
          font-medium 
          border
          ${isPremium ? 'shadow-sm' : ''}
          ${isFallback ? 'border-orange-300 bg-orange-50 text-orange-800' : ''}
          ${className}
        `}
      >
        <Icon className={iconSizes[size]} />
        <span>{modelConfig.name}</span>
        {isPremium && !isFallback && (
          <Sparkles className={`${iconSizes[size]} ml-1`} />
        )}
        {isFallback && (
          <span className="text-xs opacity-75">(Fallback)</span>
        )}
      </Badge>
    </motion.div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <span className="font-semibold">{modelConfig.name}</span>
              <Badge variant="outline" className={PLAN_COLORS[modelConfig.tier as keyof typeof PLAN_COLORS]}>
                {modelConfig.tier}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {modelConfig.description}
            </p>
            {isFallback && originalModel && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-orange-600">
                  <strong>Note:</strong> Fallback from {MODEL_CONFIG[originalModel as keyof typeof MODEL_CONFIG]?.name || originalModel} due to temporary unavailability.
                </p>
              </div>
            )}
            {isPremium && !isFallback && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-1 text-xs text-purple-600">
                  <Crown className="h-3 w-3" />
                  <span>Premium AI Model</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enhanced capabilities available with {modelConfig.tier} plan
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for inline use
export function PremiumAIIndicator({ model, plan }: { model: string; plan: string }) {
  const actualModel = model.includes('(fallback from') 
    ? model.split(' (fallback from')[0] 
    : model;
  
  const modelConfig = MODEL_CONFIG[actualModel as keyof typeof MODEL_CONFIG];
  const isPremium = modelConfig?.tier !== 'FREE';

  if (!isPremium) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="inline-flex items-center space-x-1"
    >
      <Crown className="h-3 w-3 text-purple-600" />
      <span className="text-xs text-purple-600 font-medium">Premium AI</span>
    </motion.div>
  );
}

// Usage examples:
// <PremiumAIBadge model="gpt-4o-mini" plan="PRO" />
// <PremiumAIBadge model="deepseek-r1 (fallback from gpt-4o-mini)" plan="PRO" />
// <PremiumAIIndicator model="gpt-4o-mini" plan="PRO" />
