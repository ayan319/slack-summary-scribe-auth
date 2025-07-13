'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Heart, Star, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Animated button with hover effects
export function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  ...props 
}: any) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        variant={variant}
        size={size}
        className={`transition-all duration-200 ${className}`}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}

// Copy to clipboard with animation
export function CopyButton({ 
  text, 
  children, 
  className = '' 
}: { 
  text: string; 
  children?: React.ReactNode; 
  className?: string; 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      className={`inline-flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="h-4 w-4 text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            transition={{ duration: 0.2 }}
          >
            <Copy className="h-4 w-4 text-gray-500" />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </motion.button>
  );
}

// Like button with heart animation
export function LikeButton({ 
  liked: initialLiked = false, 
  onToggle,
  className = '' 
}: { 
  liked?: boolean; 
  onToggle?: (liked: boolean) => void;
  className?: string;
}) {
  const [liked, setLiked] = useState(initialLiked);

  const handleToggle = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    onToggle?.(newLiked);
  };

  return (
    <motion.button
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors ${
        liked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
      } ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
      </motion.div>
    </motion.button>
  );
}

// Star rating with animation
export function StarRating({ 
  rating, 
  maxRating = 5, 
  onRate,
  readonly = false,
  className = '' 
}: {
  rating: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  className?: string;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className={`flex space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        
        return (
          <motion.button
            key={index}
            onClick={() => !readonly && onRate?.(starValue)}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            whileHover={readonly ? {} : { scale: 1.2 }}
            whileTap={readonly ? {} : { scale: 0.9 }}
            disabled={readonly}
          >
            <Star 
              className={`h-5 w-5 transition-colors ${
                isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`} 
            />
          </motion.button>
        );
      })}
    </div>
  );
}

// Floating action button with pulse
export function FloatingActionButton({ 
  onClick, 
  icon: Icon = Zap, 
  className = '',
  pulse = false 
}: {
  onClick: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={pulse ? { duration: 2, repeat: Infinity } : {}}
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
}

// Progress indicator with animation
export function AnimatedProgress({ 
  value, 
  max = 100, 
  className = '',
  showPercentage = true,
  color = 'blue' 
}: {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'red';
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        {showPercentage && (
          <motion.span 
            className="text-sm font-medium text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Tooltip with animation
export function AnimatedTooltip({ 
  children, 
  content, 
  position = 'top',
  className = '' 
}: {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap ${positionClasses[position]}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sparkle effect for celebrations
export function SparkleEffect({ 
  trigger, 
  children,
  className = '' 
}: {
  trigger: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newSparkles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      
      setSparkles(newSparkles);
      
      setTimeout(() => setSparkles([]), 1000);
    }
  }, [trigger]);

  return (
    <div className={`relative ${className}`}>
      {children}
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1, 0], 
              rotate: 360,
              x: [0, (Math.random() - 0.5) * 100],
              y: [0, (Math.random() - 0.5) * 100],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute pointer-events-none"
            style={{ 
              left: `${sparkle.x}%`, 
              top: `${sparkle.y}%` 
            }}
          >
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hover card with smooth animation
export function HoverCard({ 
  children, 
  className = '',
  hoverScale = 1.02 
}: {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
}) {
  return (
    <motion.div
      className={`transition-shadow duration-200 ${className}`}
      whileHover={{ 
        scale: hoverScale, 
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
