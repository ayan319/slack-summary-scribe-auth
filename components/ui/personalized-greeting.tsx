'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Crown, 
  Zap, 
  Star, 
  Calendar,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  created_at: string;
}

interface GreetingData {
  user: User;
  stats: {
    total_summaries: number;
    summaries_today: number;
    streak_days: number;
    quality_score: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked_at: string;
  }>;
}

interface PersonalizedGreetingProps {
  data?: GreetingData;
  isLoading?: boolean;
  onUpgradeClick?: () => void;
}

export function PersonalizedGreeting({ 
  data, 
  isLoading = false, 
  onUpgradeClick 
}: PersonalizedGreetingProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading || !data) {
    return <GreetingSkeleton />;
  }

  const { user, stats, achievements } = data;
  
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getPlanIcon = () => {
    switch (user.plan) {
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

  const getPlanColor = () => {
    switch (user.plan) {
      case 'FREE':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'PRO':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'ENTERPRISE':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getMotivationalMessage = () => {
    if (stats.summaries_today === 0) {
      return "Ready to create your first summary today?";
    } else if (stats.summaries_today < 3) {
      return "You're off to a great start today!";
    } else if (stats.summaries_today < 10) {
      return "You're on fire today! Keep it up!";
    } else {
      return "Incredible productivity today! 🔥";
    }
  };

  const getUserInitials = () => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-100"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
              <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-gray-900">
                {getTimeBasedGreeting()}, {user.name?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="text-gray-600">{getMotivationalMessage()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-3"
            >
              <Badge className={`${getPlanColor()} flex items-center space-x-1`}>
                {getPlanIcon()}
                <span>{user.plan}</span>
              </Badge>

              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{daysSinceJoined} days with us</span>
              </div>

              {stats.streak_days > 0 && (
                <div className="flex items-center space-x-1 text-sm text-orange-600">
                  <Target className="h-4 w-4" />
                  <span>{stats.streak_days} day streak</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-right space-y-2"
        >
          {user.plan === 'FREE' && (
            <Button
              onClick={onUpgradeClick}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
          
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Quality: {(stats.quality_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
      >
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.total_summaries}</div>
          <div className="text-sm text-gray-600">Total Summaries</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.summaries_today}</div>
          <div className="text-sm text-gray-600">Today's Summaries</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{(stats.quality_score * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Avg Quality</div>
        </div>
      </motion.div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Achievements</h3>
          <div className="flex space-x-3 overflow-x-auto">
            {achievements.slice(0, 3).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex-shrink-0 bg-white rounded-lg p-3 border border-gray-200 shadow-sm min-w-[200px]"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{achievement.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{achievement.title}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function GreetingSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="flex space-x-3">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
