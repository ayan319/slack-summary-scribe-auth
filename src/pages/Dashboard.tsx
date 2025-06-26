import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Star,
  TrendingUp,
  TrendingDown,
  FileText,
  Flag,
  Users,
  Activity,
  Calendar as CalendarIcon,
  Filter,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  CheckSquare,
  Download,
  X,
  Database,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  SummaryData,
  HistoryItem,
  FilterOptions,
  NotionSettings as NotionSettingsType,
} from "@/types/summary";
import { SummaryFilters } from "@/components/SummaryFilters";
import { NotionSettings } from "@/components/NotionSettings";
import { SummaryCard } from "@/components/SummaryCard";
import { getSummaries, type ApiSummary } from "@/api/summaries";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { MobileMenu } from "@/components/MobileMenu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSummaryPDF, generateBulkPDFs } from "@/utils/pdfExport";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isWithinInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { exportToNotion, exportBulkToNotion } from "@/utils/notionExport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FilterState,
  loadFilters,
  saveFilters,
  clearFilters as clearStoredFilters,
} from "@/utils/filterStorage";
import { FilterShareDialog } from "@/components/FilterShareDialog";
import { parseFilterShareLink } from "@/utils/filterExport";
import { FilterTemplatesDialog } from "@/components/FilterTemplatesDialog";
import { FilterTemplate } from "@/utils/filterTemplates";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Helper: flatten an array of arrays
const flatten = <T,>(arr: T[][]) => arr.reduce((a, b) => a.concat(b), []);

// Aggregate top N counts for array values
function topCount(list: string[], topN = 3) {
  const count: Record<string, number> = {};
  list.forEach((item) => {
    count[item] = (count[item] || 0) + 1;
  });
  return Object.entries(count)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([name, num]) => ({ name, count: num }));
}

const StatCard = ({
  icon,
  label,
  value,
  trend,
  trendValue,
  color = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}) => {
  const colorClasses = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    purple: "text-purple-500 bg-purple-50",
    orange: "text-orange-500 bg-orange-50",
    red: "text-red-500 bg-red-50",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">
          {label}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        {trend && trendValue && (
          <div
            className={`flex items-center text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ListCard = ({
  icon,
  label,
  items,
  color = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  items: { name: string; count: number }[];
  color?: "blue" | "green" | "purple" | "orange" | "red";
}) => {
  const colorClasses = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    purple: "text-purple-500 bg-purple-50",
    orange: "text-orange-500 bg-orange-50",
    red: "text-red-500 bg-red-50",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-500 text-sm">No data available yet</p>
            </div>
          )}
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="text-gray-700 font-medium text-sm truncate flex-1 mr-3">
                {item.name}
              </span>
              <Badge variant="secondary" className="text-xs font-semibold">
                {item.count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ITEMS_PER_PAGE = 10;

type SortField = "timestamp" | "skills" | "rating";
type SortOrder = "asc" | "desc";

// Convert ApiSummary to HistoryItem
const convertToHistoryItem = (summary: ApiSummary): HistoryItem => ({
  id: summary.id,
  timestamp: new Date(summary.timestamp),
  transcript: summary.transcript,
  summary: {
    candidateSummary: typeof summary.summary === 'string' ? summary.summary : summary.summary?.summary || '',
    keySkills: typeof summary.summary === 'object' && summary.summary?.key_skills ? summary.summary.key_skills : [],
    redFlags: typeof summary.summary === 'object' && summary.summary?.red_flags ? summary.summary.red_flags : [],
    suggestedActions: typeof summary.summary === 'object' && summary.summary?.action_items ? summary.summary.action_items : [],
    rating: 0,
    userRating: summary.userRating,
    tags: summary.tags || [],
  },
  title: summary.title || `Summary - ${new Date(summary.timestamp).toLocaleDateString()}`,
  userRating: summary.userRating,
  tags: summary.tags || [],
  messageId: summary.id,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<ApiSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedSummaries, setSelectedSummaries] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [notionSettings, setNotionSettings] = useState<{
    apiKey: string;
    databaseId: string;
  } | null>(null);
  const [isNotionSettingsOpen, setIsNotionSettingsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    skills: [],
    redFlags: [],
    actions: [],
    searchQuery: "",
    sortField: "date",
    sortOrder: "desc",
    dateRange: {
      from: null,
      to: null,
    },
  });
  const [showNotionSettings, setShowNotionSettings] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleExportPDF = async (summary: ApiSummary) => {
    try {
      await generateSummaryPDF(summary);
      toast({
        title: "Export Successful",
        description: "Summary exported to PDF successfully",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export summary to PDF",
        variant: "destructive",
      });
    }
  };

  const handleBulkExport = async () => {
    const selectedItems = currentSummaries.filter((s) =>
      selectedSummaries.includes(s.id),
    );
    if (selectedItems.length === 0) {
      toast({
        title: "No Summaries Selected",
        description: "Please select at least one summary to export",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateBulkPDFs(selectedItems);
      toast({
        title: "Export Successful",
        description: `${selectedItems.length} summaries exported to PDF successfully`,
      });
      setSelectedSummaries([]);
      setIsSelectMode(false);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export summaries to PDF",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const { data, error } = await getSummaries();
        if (error) {
          throw new Error(error);
        }
        if (data) {
          setSummaries(data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch summaries",
        );
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch summaries",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [toast]);

  // Check for shared filters in URL on mount
  useEffect(() => {
    const sharedFilters = parseFilterShareLink();
    if (sharedFilters) {
      setFilters(sharedFilters);
      saveFilters(sharedFilters);
      toast({
        title: "Success",
        description: "Shared filters loaded successfully",
      });
    }
  }, []);

  // Filter summaries based on selected filters
  const filteredSummaries = summaries.filter((summary) => {
    const summaryData = typeof summary.summary === 'object' ? summary.summary : {};
    const matchesSkills =
      filters.skills.length === 0 ||
      filters.skills.every((skill) => (summaryData.key_skills || []).includes(skill));
    const matchesRedFlags =
      filters.redFlags.length === 0 ||
      filters.redFlags.every((flag) => (summaryData.red_flags || []).includes(flag));
    const matchesActions =
      filters.actions.length === 0 ||
      filters.actions.every((action) => (summaryData.action_items || []).includes(action));
    const matchesSearch =
      !filters.searchQuery ||
      summary.transcript
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase());

    return matchesSkills && matchesRedFlags && matchesActions && matchesSearch;
  });

  // Sort summaries
  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;

    switch (sortField) {
      case "timestamp":
        return (
          multiplier *
          (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );
      case "skills":
        const aSkills = typeof a.summary === 'object' && a.summary?.key_skills ? a.summary.key_skills.length : 0;
        const bSkills = typeof b.summary === 'object' && b.summary?.key_skills ? b.summary.key_skills.length : 0;
        return multiplier * (aSkills - bSkills);
      default:
        return 0;
    }
  });

  // Update pagination calculations to use sortedSummaries
  const totalPages = Math.ceil(sortedSummaries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    sortedSummaries.length,
  );
  const currentSummaries = sortedSummaries.slice(startIndex, endIndex);

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleSelectSummary = (summaryId: string) => {
    setSelectedSummaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(summaryId)) {
        newSet.delete(summaryId);
      } else {
        newSet.add(summaryId);
      }
      return Array.from(newSet);
    });
  };

  const handleSelectAll = () => {
    if (selectedSummaries.length === currentSummaries.length) {
      setSelectedSummaries([]);
    } else {
      setSelectedSummaries(currentSummaries.map((s) => s.id));
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleExportToNotion = async (summary: ApiSummary) => {
    if (!notionSettings) {
      setIsNotionSettingsOpen(true);
      return;
    }

    try {
      await exportToNotion(convertToHistoryItem(summary), notionSettings);
      toast({
        title: "Export Successful",
        description: "Summary exported to Notion successfully",
      });
    } catch (error) {
      console.error("Error exporting to Notion:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export summary to Notion",
        variant: "destructive",
      });
    }
  };

  const handleBulkExportToNotion = async () => {
    if (!notionSettings) {
      setIsNotionSettingsOpen(true);
      return;
    }

    const selectedItems = currentSummaries.filter((s) =>
      selectedSummaries.includes(s.id),
    );
    if (selectedItems.length === 0) {
      toast({
        title: "No Summaries Selected",
        description: "Please select at least one summary to export",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportBulkToNotion(
        selectedItems.map(convertToHistoryItem),
        notionSettings,
      );
      toast({
        title: "Export Successful",
        description: `${selectedItems.length} summaries exported to Notion successfully`,
      });
      setSelectedSummaries([]);
      setIsSelectMode(false);
    } catch (error) {
      console.error("Error exporting to Notion:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export summaries to Notion",
        variant: "destructive",
      });
    }
  };

  // Update filters and save to localStorage
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    saveFilters(updatedFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      skills: [],
      redFlags: [],
      actions: [],
      searchQuery: "",
      sortField: "date",
      sortOrder: "desc",
      dateRange: {
        from: null,
        to: null,
      },
    });
    toast({
      title: "Filters Cleared",
      description: "All filters have been cleared",
    });
  };

  const handleApplyTemplate = (templateFilters: FilterState) => {
    setFilters(templateFilters);
    toast({
      title: "Template Applied",
      description: "Filter template has been applied successfully",
    });
  };

  const handleImportFilters = (importedFilters: FilterState) => {
    setFilters(importedFilters);
    toast({
      title: "Filters Imported",
      description: "Filter configuration has been imported successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {loading ? (
        <div className="p-4">
          <DashboardHeader
            title="Loading..."
            subtitle="Please wait while we fetch your summaries"
            onMenuClick={() => setIsMenuOpen(true)}
            isMenuOpen={isMenuOpen}
          />
        </div>
      ) : error ? (
        <div className="p-4">
          <DashboardHeader
            title="Error"
            subtitle={error}
            onMenuClick={() => setIsMenuOpen(true)}
            isMenuOpen={isMenuOpen}
          />
          <div className="mt-4">
            <Button onClick={() => navigate("/slack-test")}>
              Create Your First Summary
            </Button>
          </div>
        </div>
      ) : summaries.length === 0 ? (
        <div className="p-4">
          <DashboardHeader
            title="No Summaries"
            subtitle="You haven't created any summaries yet"
            onMenuClick={() => setIsMenuOpen(true)}
            isMenuOpen={isMenuOpen}
          />
          <div className="mt-4">
            <Button onClick={() => navigate("/slack-test")}>
              Create Your First Summary
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <DashboardHeader
            title="Interview Summaries"
            subtitle={`Showing ${startIndex + 1}-${endIndex} of ${sortedSummaries.length} summaries`}
            onMenuClick={() => setIsMenuOpen(true)}
            isMenuOpen={isMenuOpen}
          />

          {/* Search, Sort, and Bulk Actions */}
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search summaries, skills, or red flags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[240px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  {dateRange?.from && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDateRange(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Select
                          value={sortField}
                          onValueChange={(value: SortField) =>
                            setSortField(value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="timestamp">Date</SelectItem>
                            <SelectItem value="skills">Skills Count</SelectItem>
                          </SelectContent>
                        </Select>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort summaries by date, number of skills, or rating</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortOrder}
                  className="shrink-0"
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSortField("timestamp");
                    setSortOrder("desc");
                  }}
                  className="shrink-0"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectMode(!isSelectMode)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  {isSelectMode ? "Cancel Selection" : "Select Summaries"}
                </Button>
                {isSelectMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectedSummaries.length === currentSummaries.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
              </div>
              {isSelectMode && selectedSummaries.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button onClick={handleBulkExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF ({selectedSummaries.length})
                  </Button>
                  <Button onClick={handleBulkExportToNotion}>
                    <Database className="h-4 w-4 mr-2" />
                    Export to Notion ({selectedSummaries.length})
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Filters</h3>
                  <div className="flex gap-2">
                    <FilterTemplatesDialog
                      open={showTemplatesDialog}
                      onOpenChange={setShowTemplatesDialog}
                      currentFilters={filters}
                      onApplyTemplate={handleApplyTemplate}
                    />
                    <FilterShareDialog
                      filters={filters}
                      onImportFilters={handleImportFilters}
                    />
                  </div>
                </div>
                <SummaryFilters
                  summaries={filteredSummaries.map(convertToHistoryItem)}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  onImportFilters={handleImportFilters}
                />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="lg:col-span-3">
              <div className="grid gap-6">
                {filteredSummaries
                  .slice(startIndex, endIndex)
                  .map((summary) => (
                    <SummaryCard
                      key={summary.id}
                      summary={summary}
                      onExportPDF={() => handleExportPDF(summary)}
                      onExportNotion={() => handleExportToNotion(summary)}
                      isSelectionMode={true}
                      isSelected={selectedSummaries.includes(summary.id)}
                      onSelect={() =>
                        setSelectedSummaries((prev) =>
                          prev.includes(summary.id)
                            ? prev.filter((id) => id !== summary.id)
                            : [...prev, summary.id],
                        )
                      }
                    />
                  ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
