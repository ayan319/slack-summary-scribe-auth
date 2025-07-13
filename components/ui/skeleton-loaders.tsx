'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

export function ShimmerEffect({ children, isLoading }: { children: React.ReactNode; isLoading: boolean }) {
  if (!isLoading) return <>{children}</>;
  
  return (
    <div className="relative overflow-hidden">
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-gray-400/30 to-transparent" />
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <SkeletonLoader className="h-4 w-24" />
        <SkeletonLoader className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <SkeletonLoader className="h-8 w-16 mb-2" />
        <SkeletonLoader className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonLoader className="h-6 w-32 mb-2" />
        <SkeletonLoader className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="w-full animate-pulse bg-gray-200 rounded" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonLoader className="h-6 w-32 mb-2" />
        <SkeletonLoader className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <SkeletonLoader className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLoader className="h-4 w-3/4" />
              <SkeletonLoader className="h-3 w-1/2" />
              <SkeletonLoader className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
          <SkeletonLoader className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-3 w-1/2" />
          </div>
          <SkeletonLoader className="h-2 w-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SlackStatusSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonLoader className="h-6 w-32 mb-2" />
        <SkeletonLoader className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonLoader className="h-10 w-10 rounded" />
            <div className="space-y-2">
              <SkeletonLoader className="h-4 w-24" />
              <SkeletonLoader className="h-3 w-16" />
            </div>
          </div>
          <SkeletonLoader className="h-8 w-20 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GreetingSkeleton() {
  return (
    <div className="flex items-center space-x-4 mb-8">
      <SkeletonLoader className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <SkeletonLoader className="h-8 w-48" />
        <SkeletonLoader className="h-4 w-32" />
        <SkeletonLoader className="h-4 w-24" />
      </div>
    </div>
  );
}

export function OnboardingCardSkeleton() {
  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonLoader className="h-6 w-48" />
            <SkeletonLoader className="h-4 w-64" />
          </div>
          <SkeletonLoader className="h-6 w-6 rounded" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonLoader className="h-3 w-32" />
            <SkeletonLoader className="h-3 w-8" />
          </div>
          <SkeletonLoader className="h-2 w-full rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
            <SkeletonLoader className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLoader className="h-4 w-3/4" />
              <SkeletonLoader className="h-3 w-1/2" />
            </div>
            <SkeletonLoader className="h-8 w-20 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function InsightCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonLoader className="h-6 w-32 mb-2" />
        <SkeletonLoader className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonLoader className="h-4 w-32" />
              <SkeletonLoader className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonLoader className="h-3 w-full" />
            <SkeletonLoader className="h-3 w-3/4" />
            <SkeletonLoader className="h-8 w-24 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Add shimmer animation to global CSS
export const shimmerStyles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
`;
