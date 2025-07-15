import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl'
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative">
        <MessageSquare className={cn(
          sizeClasses[size],
          'text-blue-600 dark:text-blue-400'
        )} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
      </div>
      {showText && (
        <span className={cn(
          textSizeClasses[size],
          'font-bold text-gray-900 dark:text-white'
        )}>
          Slack Summary Scribe
        </span>
      )}
    </div>
  );
}
