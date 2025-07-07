import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md w-full">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
          <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription>
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Looking for something specific?
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in to your account
                </Link>
                <Link
                  href="/help"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Visit our help center
                </Link>
                <Link
                  href="/contact"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          Error Code: 404 | Page Not Found
        </div>
      </div>
    </div>
  );
}
