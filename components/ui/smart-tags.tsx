'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tags, 
  Sparkles, 
  Filter, 
  X, 
  Brain,
  Briefcase,
  Code,
  Users,
  CheckSquare,
  TrendingUp,
  Heart,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SummaryTags {
  skills: string[];
  technologies: string[];
  roles: string[];
  action_items: string[];
  decisions: string[];
  sentiments: string[];
  emotions: string[];
  confidence_score: number;
}

interface SmartTagsProps {
  tags?: SummaryTags;
  summaryId?: string;
  isLoading?: boolean;
  isPremium?: boolean;
  onTagClick?: (tag: string, category: string) => void;
  onGenerateTags?: () => void;
  className?: string;
}

const TAG_CATEGORIES = {
  skills: { icon: Brain, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Skills' },
  technologies: { icon: Code, color: 'bg-green-100 text-green-800 border-green-200', label: 'Tech' },
  roles: { icon: Users, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Roles' },
  action_items: { icon: CheckSquare, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Actions' },
  decisions: { icon: TrendingUp, color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Decisions' },
  sentiments: { icon: Heart, color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Sentiment' },
  emotions: { icon: Sparkles, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Emotions' }
};

export function SmartTags({ 
  tags, 
  summaryId, 
  isLoading = false, 
  isPremium = false,
  onTagClick,
  onGenerateTags,
  className = '' 
}: SmartTagsProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleTagClick = (tag: string, category: string) => {
    if (onTagClick) {
      onTagClick(tag, category);
    }
    
    // Add to filters if not already selected
    if (!selectedFilters.includes(tag)) {
      setSelectedFilters([...selectedFilters, tag]);
    }
  };

  const removeFilter = (tag: string) => {
    setSelectedFilters(selectedFilters.filter(f => f !== tag));
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
  };

  const renderTagCategory = (category: keyof SummaryTags, categoryTags: string[]) => {
    if (!categoryTags || categoryTags.length === 0) return null;

    const { icon: Icon, color, label } = TAG_CATEGORIES[category];
    const displayTags = showAllCategories ? categoryTags : categoryTags.slice(0, 3);

    return (
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {categoryTags.length > 3 && !showAllCategories && (
            <Badge variant="secondary" className="text-xs">
              +{categoryTags.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag, index) => (
            <motion.div
              key={`${category}-${tag}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Badge
                variant="outline"
                className={`${color} cursor-pointer hover:shadow-sm transition-all duration-200 text-xs`}
                onClick={() => handleTagClick(tag, category)}
              >
                {tag}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (!isPremium) {
    return (
      <Card className={`border-dashed border-2 border-gray-200 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center space-x-2 mb-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Smart Tagging Available</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-sm">
            Upgrade to Pro to automatically extract skills, technologies, action items, and more from your summaries.
          </p>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tags className="h-5 w-5" />
            <span>Smart Tags</span>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          </CardTitle>
          <CardDescription>Generating AI-powered tags...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tags) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tags className="h-5 w-5" />
            <span>Smart Tags</span>
          </CardTitle>
          <CardDescription>AI-powered tag extraction</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No tags generated yet</p>
          {onGenerateTags && (
            <Button onClick={onGenerateTags} size="sm">
              <Brain className="h-4 w-4 mr-2" />
              Generate Smart Tags
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const hasAnyTags = Object.values(tags).some(tagArray => 
    Array.isArray(tagArray) && tagArray.length > 0
  );

  if (!hasAnyTags) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tags className="h-5 w-5" />
            <span>Smart Tags</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-gray-600">No tags found in this summary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Tags className="h-5 w-5" />
            <span>Smart Tags</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {tags.confidence_score && (
              <Badge variant="outline" className="text-xs">
                {Math.round(tags.confidence_score * 100)}% confidence
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCategories(!showAllCategories)}
            >
              {showAllCategories ? 'Show Less' : 'Show All'}
            </Button>
          </div>
        </div>
        <CardDescription>
          AI-extracted insights from your summary content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Active Filters */}
        <AnimatePresence>
          {selectedFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Active Filters</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFilters.map(filter => (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-300"
                    onClick={() => removeFilter(filter)}
                  >
                    {filter}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Categories */}
        <div className="space-y-4">
          {Object.entries(tags).map(([category, categoryTags]) => {
            if (category === 'confidence_score' || !Array.isArray(categoryTags)) return null;
            return renderTagCategory(category as keyof SummaryTags, categoryTags);
          })}
        </div>
      </CardContent>
    </Card>
  );
}
