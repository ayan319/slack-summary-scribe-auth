
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export const PreferencesSettings = () => {
  const [defaultExportMode, setDefaultExportMode] = useState('slack');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(true);
  const { toast } = useToast();

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Updated",
      description: "Your summary preferences have been saved.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Export Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preferences</CardTitle>
          <CardDescription>
            Configure default export settings for your summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultExport">Default Export Mode</Label>
            <Select value={defaultExportMode} onValueChange={setDefaultExportMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select default export option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="notion">Notion</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="none">Manual Export Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoSync">Auto-sync new summaries</Label>
              <p className="text-sm text-gray-500">
                Automatically export summaries using the default mode
              </p>
            </div>
            <Switch
              id="autoSync"
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified about summary updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="slackNotifications">Slack Notifications</Label>
              <p className="text-sm text-gray-500">Get notified in Slack</p>
            </div>
            <Switch
              id="slackNotifications"
              checked={slackNotifications}
              onCheckedChange={setSlackNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSavePreferences}>Save Preferences</Button>
    </div>
  );
};
