'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Users, Zap } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { createOrganization } from '@/lib/auth';

function OnboardingContent() {
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshOrganizations } = useAuth();
  const router = useRouter();

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationName.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!user) {
      setError('User not found. Please try logging in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createOrganization(organizationName.trim(), user.id);
      await refreshOrganizations();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Create a default organization
    const defaultName = `${user?.name || 'My'} Workspace`;
    setOrganizationName(defaultName);
    handleCreateOrganization(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Slack Summary Scribe!</CardTitle>
          <CardDescription>
            Let's set up your workspace to get started with AI-powered Slack summaries.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">AI-Powered Summaries</p>
                <p className="text-xs text-muted-foreground">Get instant summaries of your Slack conversations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Team Collaboration</p>
                <p className="text-xs text-muted-foreground">Share insights with your team members</p>
              </div>
            </div>
          </div>

          {/* Organization Form */}
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="e.g., Acme Corp, My Team"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={loading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                You can always change this later in settings.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading || !organizationName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
                className="w-full"
              >
                Use Default Name
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By creating a workspace, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return <OnboardingContent />;
}
