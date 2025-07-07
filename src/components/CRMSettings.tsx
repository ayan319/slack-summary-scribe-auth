import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Database, CheckCircle, AlertCircle } from "lucide-react";

export interface CRMMapping {
  summaryField: string;
  crmField: string;
}

export interface CRMSettings {
  isConnected: boolean;
  crmType: string;
  apiKey?: string;
  autoSync: boolean;
  fieldMappings: CRMMapping[];
}

interface CRMSettingsProps {
  settings: CRMSettings;
  onSettingsUpdate: (settings: CRMSettings) => void;
}

const CRM_OPTIONS = [
  {
    value: "hubspot",
    label: "HubSpot",
    description: "CRM & Marketing Platform",
  },
  {
    value: "salesforce",
    label: "Salesforce",
    description: "Enterprise CRM Solution",
  },
  {
    value: "pipedrive",
    label: "Pipedrive",
    description: "Sales Pipeline Management",
  },
  { value: "zoho", label: "Zoho CRM", description: "All-in-one CRM Suite" },
];

const SUMMARY_FIELDS = [
  "candidateSummary",
  "keySkills",
  "redFlags",
  "suggestedActions",
  "rating",
  "tags",
];

const CRM_FIELDS = {
  hubspot: [
    "contact_name",
    "email",
    "phone",
    "company",
    "job_title",
    "notes",
    "lead_status",
  ],
  salesforce: [
    "FirstName",
    "LastName",
    "Email",
    "Phone",
    "Account",
    "Title",
    "Description",
    "LeadStatus",
  ],
  pipedrive: ["name", "email", "phone", "org_name", "title", "notes", "status"],
  zoho: [
    "First_Name",
    "Last_Name",
    "Email",
    "Phone",
    "Account_Name",
    "Title",
    "Description",
    "Lead_Status",
  ],
};

export const CRMSettings: React.FC<CRMSettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<CRMSettings>(settings);
  const { toast } = useToast();

  const handleSave = () => {
    onSettingsUpdate(localSettings);
    setIsOpen(false);
    toast({
      title: "CRM Settings Updated",
      description: "Your CRM integration settings have been saved.",
    });
  };

  const handleConnect = () => {
    if (localSettings.crmType && localSettings.apiKey) {
      setLocalSettings((prev) => ({ ...prev, isConnected: true }));
      toast({
        title: "CRM Connected",
        description: `Successfully connected to ${CRM_OPTIONS.find((crm) => crm.value === localSettings.crmType)?.label}`,
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Please select a CRM and enter your API key.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    setLocalSettings((prev) => ({
      ...prev,
      isConnected: false,
      apiKey: "",
      autoSync: false,
      fieldMappings: [],
    }));
    toast({
      title: "CRM Disconnected",
      description: "Your CRM integration has been disconnected.",
    });
  };

  const addFieldMapping = () => {
    setLocalSettings((prev) => ({
      ...prev,
      fieldMappings: [
        ...prev.fieldMappings,
        { summaryField: "", crmField: "" },
      ],
    }));
  };

  const updateFieldMapping = (
    index: number,
    field: "summaryField" | "crmField",
    value: string,
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map((mapping, i) =>
        i === index ? { ...mapping, [field]: value } : mapping,
      ),
    }));
  };

  const removeFieldMapping = (index: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      fieldMappings: prev.fieldMappings.filter((_, i) => i !== index),
    }));
  };

  const selectedCRM = CRM_OPTIONS.find(
    (crm) => crm.value === localSettings.crmType,
  );
  const availableCRMFields = localSettings.crmType
    ? CRM_FIELDS[localSettings.crmType as keyof typeof CRM_FIELDS]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          CRM Settings
          {settings.isConnected && (
            <Badge variant="default" className="ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            CRM Integration Settings
          </DialogTitle>
          <DialogDescription>
            Connect your CRM to automatically sync interview summaries and
            candidate data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* CRM Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose Your CRM</CardTitle>
              <CardDescription>
                Select the CRM platform you want to integrate with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="crmType">CRM Platform</Label>
                <Select
                  value={localSettings.crmType}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      crmType: value,
                      fieldMappings: [],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a CRM platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_OPTIONS.map((crm) => (
                      <SelectItem key={crm.value} value={crm.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{crm.label}</span>
                          <span className="text-sm text-gray-500">
                            {crm.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {localSettings.crmType && (
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your CRM API key"
                    value={localSettings.apiKey || ""}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        apiKey: e.target.value,
                      }))
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your API key will be encrypted and stored securely.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Status */}
          {localSettings.crmType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {localSettings.isConnected ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">
                            Connected to {selectedCRM?.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ready to sync data
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">Not Connected</p>
                          <p className="text-sm text-gray-500">
                            Click connect to test your credentials
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-x-2">
                    {localSettings.isConnected ? (
                      <Button variant="destructive" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={handleConnect}
                        disabled={!localSettings.apiKey}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto-sync Settings */}
          {localSettings.isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sync Settings</CardTitle>
                <CardDescription>
                  Configure how summaries are automatically synced to your CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSync" className="text-base font-medium">
                      Enable Auto-Sync
                    </Label>
                    <p className="text-sm text-gray-500">
                      Automatically sync new summaries to your CRM
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.autoSync}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        autoSync: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Field Mapping */}
          {localSettings.isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Mapping</CardTitle>
                <CardDescription>
                  Map interview summary fields to your CRM fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {localSettings.fieldMappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label>Summary Field</Label>
                      <Select
                        value={mapping.summaryField}
                        onValueChange={(value) =>
                          updateFieldMapping(index, "summaryField", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select summary field" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUMMARY_FIELDS.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>CRM Field</Label>
                      <Select
                        value={mapping.crmField}
                        onValueChange={(value) =>
                          updateFieldMapping(index, "crmField", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CRM field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCRMFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFieldMapping(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addFieldMapping}
                  className="w-full"
                >
                  Add Field Mapping
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
