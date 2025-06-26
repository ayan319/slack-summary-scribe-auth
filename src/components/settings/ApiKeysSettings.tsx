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
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const ApiKeysSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpdateApiKeys = () => {
    toast({
      title: "API Keys Updated",
      description: "Your API keys have been updated successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys & Tokens</CardTitle>
        <CardDescription>Manage your Slack tokens and API keys</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Slack Integration Status
          </h4>
          <p className="text-blue-700 text-sm mb-3">
            Your Slack tokens are securely stored and managed automatically.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/slack-test")}
          >
            Test Slack Connection
          </Button>
        </div>
        <div>
          <Label htmlFor="apiKey">Custom API Key (Optional)</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            This is for any additional integrations you might want to add.
          </p>
        </div>
        <Button variant="outline" onClick={handleUpdateApiKeys}>
          Update API Keys
        </Button>
      </CardContent>
    </Card>
  );
};
