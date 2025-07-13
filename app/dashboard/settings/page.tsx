'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Brain, 
  Building2, 
  Crown, 
  User, 
  Bell,
  Shield,
  Zap,
  TrendingUp
} from 'lucide-react';
import { CRMConnections } from '@/components/ui/crm-connections';
import { AIModelSelector } from '@/components/ui/ai-model-selector';
import { OnboardingChecklist } from '@/components/ui/onboarding-checklist';

export default function SettingsPage() {
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
  const [selectedAIModel, setSelectedAIModel] = useState('deepseek-r1');
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleUpgradeClick = (requiredPlan: string) => {
    console.log('Upgrade clicked for plan:', requiredPlan);
    // In production, redirect to billing/upgrade page
    alert(`Upgrade to ${requiredPlan} plan to unlock premium features!`);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedAIModel(modelId);
    console.log('AI model selected:', modelId);
  };

  const handleCRMConnectionChange = (crmType: string, status: string) => {
    console.log('CRM connection changed:', { crmType, status });
  };

  const handleOnboardingStepComplete = (stepName: string) => {
    console.log('Onboarding step completed:', stepName);
  };

  const getPlanBadge = () => {
    const planConfig = {
      FREE: { color: 'bg-blue-100 text-blue-800', icon: <Zap className="h-3 w-3" /> },
      PRO: { color: 'bg-purple-100 text-purple-800', icon: <Crown className="h-3 w-3" /> },
      ENTERPRISE: { color: 'bg-yellow-100 text-yellow-800', icon: <Crown className="h-3 w-3" /> }
    };

    const config = planConfig[userPlan];
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        {config.icon}
        <span>{userPlan}</span>
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Settings className="h-8 w-8" />
              <span>Settings</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your AI models, integrations, and account preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getPlanBadge()}
            <Button onClick={() => handleUpgradeClick('PRO')} className="bg-purple-600 hover:bg-purple-700">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      {showOnboarding && (
        <div className="mb-8">
          <OnboardingChecklist
            onStepComplete={handleOnboardingStepComplete}
            onDismiss={() => setShowOnboarding(false)}
          />
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="ai-models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-models" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Models</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>CRM</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Models Tab */}
        <TabsContent value="ai-models" className="space-y-6">
          <AIModelSelector
            userPlan={userPlan}
            selectedModel={selectedAIModel}
            onModelSelect={handleModelSelect}
            onUpgradeClick={handleUpgradeClick}
            showComparison={true}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>AI Usage Analytics</span>
              </CardTitle>
              <CardDescription>
                Track your AI model usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">127</div>
                  <div className="text-sm text-blue-700">Summaries Generated</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">84%</div>
                  <div className="text-sm text-green-700">Average Quality Score</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">$2.45</div>
                  <div className="text-sm text-purple-700">Total AI Costs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <CRMConnections
            onConnectionChange={handleCRMConnectionChange}
          />

          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Configure how summaries are exported to your CRM systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Export Type</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="note">Note/Activity</option>
                    <option value="contact">Contact</option>
                    <option value="deal">Deal/Opportunity</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-Export</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="manual">Manual Only</option>
                    <option value="auto">Auto-Export All</option>
                    <option value="high-quality">Auto-Export High Quality Only</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account details and subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input 
                    type="email" 
                    value="demo@example.com" 
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input 
                    type="text" 
                    value="Demo User" 
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Subscription Details</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span>Current Plan:</span>
                      {getPlanBadge()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {userPlan === 'FREE' ? 'Free plan with basic features' : 'Premium plan with advanced features'}
                    </div>
                  </div>
                  <Button onClick={() => handleUpgradeClick('PRO')}>
                    {userPlan === 'FREE' ? 'Upgrade' : 'Manage Billing'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about summaries and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email Notifications', description: 'Receive email alerts for new summaries' },
                  { id: 'slack', label: 'Slack Notifications', description: 'Get notified in Slack when summaries are ready' },
                  { id: 'browser', label: 'Browser Notifications', description: 'Show browser notifications for real-time updates' },
                  { id: 'weekly', label: 'Weekly Summary', description: 'Receive a weekly digest of your AI usage' }
                ].map(notification => (
                  <div key={notification.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">{notification.label}</div>
                      <div className="text-sm text-gray-600">{notification.description}</div>
                    </div>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and data privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">Data Export</div>
                    <div className="text-sm text-gray-600">Download all your data and summaries</div>
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-900">Delete Account</div>
                    <div className="text-sm text-red-700">Permanently delete your account and all data</div>
                  </div>
                  <Button variant="destructive">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
