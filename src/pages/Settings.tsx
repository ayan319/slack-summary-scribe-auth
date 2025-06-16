
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="self-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account, integrations, and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
            <TabsTrigger value="profile" className="text-xs md:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs md:text-sm">Integrations</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs md:text-sm">Preferences</TabsTrigger>
            <TabsTrigger value="api-keys" className="text-xs md:text-sm">API Keys</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs md:text-sm">Billing</TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsSettings />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <PreferencesSettings />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <ApiKeysSettings />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
