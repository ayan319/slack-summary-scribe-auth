import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  History,
  FileText,
  Star,
  Calendar,
  Trash2,
  Eye,
  RefreshCcw,
  Search,
  Filter,
  PlusCircle,
} from "lucide-react";
import { HistoryItem } from "../types/summary";

interface TranscriptHistoryProps {
  history: HistoryItem[];
  onLoadItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  onReload?: () => void;
  onUpdateItem?: (item: HistoryItem) => void;
  isFiltered?: boolean;
}

export const TranscriptHistory: React.FC<TranscriptHistoryProps> = ({
  history,
  onLoadItem,
  onClearHistory,
  isLoading,
  onReload,
  onUpdateItem,
  isFiltered = false,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-100 text-green-800";
    if (rating >= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  if (history.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          {isFiltered ? (
            <>
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600 mb-6">
                No summaries match your current filters. Try adjusting your
                search criteria or clearing filters.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                {onReload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReload}
                    disabled={isLoading}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Analysis History
              </h3>
              <p className="text-gray-600 mb-6">
                Your analyzed interviews will appear here for easy reference and
                comparison
              </p>
              <div className="space-y-4">
                <Badge variant="outline" className="text-sm px-4 py-2">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Start by analyzing your first interview transcript
                </Badge>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Quick tips to get started:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-blue-900 mb-1">
                        <FileText className="h-4 w-4" />
                        Paste Transcript
                      </div>
                      <p className="text-blue-700">
                        Copy and paste your interview transcript into the text
                        area above
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-green-900 mb-1">
                        <Star className="h-4 w-4" />
                        Get Analysis
                      </div>
                      <p className="text-green-700">
                        Our AI will analyze skills, red flags, and provide
                        actionable insights
                      </p>
                    </div>
                  </div>
                </div>

                {onReload && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReload}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      {isLoading ? "Loading..." : "Check for Updates"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
          <Badge variant="secondary">{history.length} interviews</Badge>
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearHistory}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            {onReload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReload}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Reload
              </Button>
            )}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="grid gap-4">
        {history.map((item) => (
          <Card
            key={item.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(item.timestamp)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRatingColor(item.summary.rating)}>
                    <Star className="h-3 w-3 mr-1" />
                    {item.summary.rating}/10
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Summary Preview
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {truncateText(item.summary.candidateSummary)}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Skills:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.summary.keySkills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {truncateText(skill, 20)}
                      </Badge>
                    ))}
                    {item.summary.keySkills.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500"
                      >
                        +{item.summary.keySkills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Concerns:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.summary.redFlags.length} identified
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Actions:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.summary.suggestedActions.length} recommended
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Transcript: {item.transcript.length} characters
                </div>
                <Button
                  size="sm"
                  onClick={() => onLoadItem(item)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
