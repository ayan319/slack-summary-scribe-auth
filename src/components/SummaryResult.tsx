import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Star,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Slack,
  FileText,
  Database,
} from "lucide-react";
import { SummaryData } from "@/types/summary";
import { SummaryRatingTags } from "./SummaryRatingTags";
import { useExportIntegrations } from "@/hooks/useExportIntegrations";

interface SummaryResultProps {
  summary: SummaryData | null;
  isLoading: boolean;
  handleExport: (type: "slack" | "notion" | "crm") => void;
  transcript?: string;
  onSummaryUpdate?: (summary: SummaryData) => void;
}

export const SummaryResult: React.FC<SummaryResultProps> = ({
  summary,
  isLoading,
  handleExport,
  transcript = "",
  onSummaryUpdate,
}) => {
  const { exportToSlack, exportToNotion, exportToCRM, isExporting } =
    useExportIntegrations();

  const handleRealExport = async (type: "slack" | "notion" | "crm") => {
    if (!summary) return;

    try {
      switch (type) {
        case "slack":
          await exportToSlack(summary, transcript);
          break;
        case "notion":
          await exportToNotion(summary, transcript);
          break;
        case "crm":
          await exportToCRM(summary, transcript);
          break;
      }
    } catch (error) {
      console.error(`Export to ${type} failed:`, error);
    }
  };

  const handleRatingChange = (rating: number) => {
    if (summary && onSummaryUpdate) {
      onSummaryUpdate({ ...summary, userRating: rating });
    }
  };

  const handleTagsChange = (tags: string[]) => {
    if (summary && onSummaryUpdate) {
      onSummaryUpdate({ ...summary, tags });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing transcript...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready for Analysis
          </h3>
          <p className="text-gray-600">
            Upload or paste a transcript to get started with AI-powered analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-100 text-green-800";
    if (rating >= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-0">
      <Card className="rounded-b-none">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Analysis Results
            </CardTitle>
            <Badge className={getRatingColor(summary.rating)}>
              <Star className="h-3 w-3 mr-1" />
              {summary.rating}/10
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {summary.candidateSummary}
            </p>
          </div>

          <Separator />

          {/* Key Skills */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Key Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {summary.keySkills.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Red Flags */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Concerns
            </h4>
            <ul className="space-y-2">
              {summary.redFlags.map((flag, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Suggested Actions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {summary.suggestedActions.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Export Options */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Export Results</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRealExport("slack")}
                disabled={isExporting.slack}
                className="flex items-center gap-2"
              >
                {isExporting.slack ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Slack className="h-4 w-4" />
                )}
                Slack
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRealExport("notion")}
                disabled={isExporting.notion}
                className="flex items-center gap-2"
              >
                {isExporting.notion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Notion
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRealExport("crm")}
                disabled={isExporting.crm}
                className="flex items-center gap-2"
              >
                {isExporting.crm ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                CRM
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating and Tags Component */}
      {onSummaryUpdate && (
        <SummaryRatingTags
          summary={summary}
          onRatingChange={handleRatingChange}
          onTagsChange={handleTagsChange}
        />
      )}
    </div>
  );
};
