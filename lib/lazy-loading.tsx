'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Generic loading component
export function LoadingSpinner({ 
  size = 'default',
  text = 'Loading...',
  className = '' 
}: {
  size?: 'sm' | 'default' | 'lg';
  text?: string;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

// Skeleton loading for charts
export function ChartLoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

// Skeleton loading for cards
export function CardLoadingSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

// Lazy load wrapper with error boundary
export function LazyWrapper({
  Component,
  fallback,
  errorFallback,
  ...props
}: {
  Component: React.LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  [key: string]: any;
}) {
  const defaultFallback = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center p-8"
    >
      <LoadingSpinner />
    </motion.div>
  );

  const defaultErrorFallback = (
    <div className="flex items-center justify-center p-8 text-red-500">
      <span>Failed to load component</span>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component {...(props as any)} />
    </Suspense>
  );
}

// Lazy loaded components
export const LazyAnalyticsCharts = lazy(() => 
  import('@/components/ui/analytics-charts').then(module => ({
    default: module.AnalyticsCharts
  }))
);

export const LazyAIActivityFeed = lazy(() => 
  import('@/components/ui/ai-activity-feed').then(module => ({
    default: module.AIActivityFeed
  }))
);

export const LazySmartActionCards = lazy(() => 
  import('@/components/ui/smart-action-cards').then(module => ({
    default: module.SmartActionCards
  }))
);

export const LazyMobileOptimizedGrid = lazy(() => 
  import('@/components/ui/mobile-optimized-grid').then(module => ({
    default: module.MobileOptimizedGrid
  }))
);

export const LazySlackStatus = lazy(() => 
  import('@/components/ui/slack-status').then(module => ({
    default: module.SlackStatus
  }))
);

export const LazyNotificationsDropdown = lazy(() => 
  import('@/components/ui/notifications-dropdown').then(module => ({
    default: module.NotificationsDropdown
  }))
);

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// Lazy load on scroll component
export function LazyOnScroll({ 
  children, 
  fallback,
  className = '',
  threshold = 0.1 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref, { threshold });
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {hasLoaded ? children : (fallback || <CardLoadingSkeleton />)}
    </div>
  );
}

// Image lazy loading with blur placeholder
export function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmc8L3RleHQ+PC9zdmc+',
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  [key: string]: any;
}) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !error && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
        />
      )}
      
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          Failed to load image
        </div>
      )}
    </div>
  );
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    // This would integrate with webpack-bundle-analyzer in a real setup
    console.log('📦 Bundle Analysis:');
    console.log('- Use `npm run analyze` to see detailed bundle breakdown');
    console.log('- Consider code splitting for large components');
    console.log('- Use dynamic imports for non-critical features');
  }
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.then(() => {
      const end = performance.now();
      console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    });
  } else {
    const end = performance.now();
    console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  }
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/inter-var.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);

    // Preload critical images
    const criticalImages = [
      '/images/logo.svg',
      '/images/hero-bg.jpg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }
}
