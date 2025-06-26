import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CRMSettings,
  CRMSettings as CRMSettingsComponent,
} from "@/components/CRMSettings";
import { NotionSettings } from "@/components/NotionSettings";
import { NotionSettings as NotionSettingsType } from "@/types/summary";
import { Slack, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const IntegrationsSettings = () => {
  const [crmSettings, setCrmSettings] = useState<CRMSettings>({
    isConnected: false,
    crmType: "",
    autoSync: false,
    fieldMappings: [],
  });

  const [notionSettings, setNotionSettings] = useState<NotionSettingsType>({
    isConnected: false,
    autoSync: false,
  });

  const { toast } = useToast();

  const handleDisconnectSlack = () => {
    toast({
      title: "Slack Disconnected",
      description: "Your Slack workspace has been disconnected.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Connected Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected integrations and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Slack className="h-6 w-6 text-purple-600" />
              <div>
                <h4 className="font-medium">Slack Workspace</h4>
                <p className="text-sm text-gray-500">My Team Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectSlack}
              >
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notion Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Notion Integration</CardTitle>
          <CardDescription>
            Connect and configure your Notion workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotionSettings
            onSave={(settings) =>
              setNotionSettings({
                ...notionSettings,
                accessToken: settings.apiKey,
                databaseId: settings.databaseId,
                isConnected: true,
              })
            }
            initialSettings={{
              apiKey: notionSettings.accessToken || "",
              databaseId: notionSettings.databaseId || "",
            }}
          />
        </CardContent>
      </Card>

      {/* CRM Integration */}
      <Card>
        <CardHeader>
          <CardTitle>CRM Integration</CardTitle>
          <CardDescription>
            Connect and configure your CRM system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CRMSettingsComponent
            settings={crmSettings}
            onSettingsUpdate={setCrmSettings}
          />
        </CardContent>
      </Card>
    </div>
  );
};
