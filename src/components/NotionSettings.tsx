import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Database,
} from "lucide-react";
import { NotionSettings as NotionSettingsType } from "@/src/types/summary";

interface NotionSettingsProps {
  onSave: (settings: { apiKey: string; databaseId: string }) => void;
  initialSettings?: { apiKey: string; databaseId: string };
}

export function NotionSettings({
  onSave,
  initialSettings,
}: NotionSettingsProps) {
  const [apiKey, setApiKey] = useState(initialSettings?.apiKey || "");
  const [databaseId, setDatabaseId] = useState(
    initialSettings?.databaseId || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!apiKey || !databaseId) {
      toast({
        title: "Missing Information",
        description: "Please provide both API key and database ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test the connection
      const response = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Notion-Version": "2022-06-28",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to connect to Notion database");
      }

      onSave({ apiKey, databaseId });
      toast({
        title: "Settings Saved",
        description: "Notion integration settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving Notion settings:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Notion. Please check your settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Notion Integration
        </CardTitle>
        <CardDescription>
          Connect your Notion database to export interview summaries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">Notion API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Notion API key"
          />
          <p className="text-sm text-gray-500">
            Get your API key from{" "}
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Notion Integrations
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="databaseId">Database ID</Label>
          <Input
            id="databaseId"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="Enter your Notion database ID"
          />
          <p className="text-sm text-gray-500">
            The ID can be found in your database URL after the workspace name
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
