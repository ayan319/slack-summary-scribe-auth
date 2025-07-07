import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="h-6 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  <Skeleton className="h-3 w-32" />
                </span>
              </div>
            </div>

            <div className="text-center">
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center">
          <Skeleton className="h-6 w-32 mx-auto mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center space-x-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthCallbackSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mx-auto" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              
              <div className="text-center">
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <Skeleton className="h-2 rounded-full w-3/5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Skeleton className="h-3 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
      
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
