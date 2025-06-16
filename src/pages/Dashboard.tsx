
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Star, TrendingUp, TrendingDown, FileText, Flag, Users, Activity, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SummaryData, HistoryItem, FilterOptions, NotionSettings as NotionSettingsType } from "@/types/summary";
import { SummaryFilters } from "@/components/SummaryFilters";
import { NotionSettings } from "@/components/NotionSettings";

// Helper: flatten an array of arrays
const flatten = <T,>(arr: T[][]) => arr.reduce((a, b) => a.concat(b), []);

// Aggregate top N counts for array values
function topCount(list: string[], topN = 3) {
  const count: Record<string, number> = {};
  list.forEach(item => { count[item] = (count[item] || 0) + 1; });
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
  color = "blue"
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
    red: "text-red-500 bg-red-50"
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        {trend && trendValue && (
          <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
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
  color = "blue"
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
    red: "text-red-500 bg-red-50"
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">{label}</CardTitle>
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
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <span className="text-gray-700 font-medium text-sm truncate flex-1 mr-3">{item.name}</span>
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

const Dashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<{ summary: SummaryData }[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<{ summary: SummaryData }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    tags: [],
    rating: null
  });
  const [notionSettings, setNotionSettings] = useState<NotionSettingsType>({
    isConnected: false,
    autoSync: false
  });
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setErrorMsg("You must be logged in to see your analytics.");
        setSummaries([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("summaries")
        .select("summary")
        .eq("user_id", session.user.id)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        setErrorMsg("Unable to load analytics. " + error.message);
        setSummaries([]);
        toast({
          title: "Error loading analytics",
          description: error.message,
          variant: "destructive",
        });
      } else if (!cancelled && data) {
        setSummaries(
          data
            .map(item => {
              // Safe casting with validation
              const summary = item.summary as unknown as SummaryData;
              if (
                typeof summary === "object" &&
                summary !== null &&
                Array.isArray(summary.keySkills) &&
                Array.isArray(summary.redFlags) &&
                Array.isArray(summary.suggestedActions) &&
                typeof summary.candidateSummary === "string" &&
                typeof summary.rating === "number"
              ) {
                return { summary };
              }
              return null;
            })
            .filter(Boolean) as { summary: SummaryData }[]
        );
      }
      setLoading(false);
    }
    fetchData();
    return () => { cancelled = true };
  }, [toast]);

  // Filter summaries based on current filters
  useEffect(() => {
    let filtered = summaries;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.summary.candidateSummary.toLowerCase().includes(searchLower) ||
        item.summary.keySkills.some(skill => skill.toLowerCase().includes(searchLower)) ||
        item.summary.redFlags.some(flag => flag.toLowerCase().includes(searchLower)) ||
        item.summary.suggestedActions.some(action => action.toLowerCase().includes(searchLower))
      );
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.summary.tags?.some(tag => filters.tags.includes(tag)) ||
        false
      );
    }

    // Rating filter
    if (filters.rating !== null) {
      filtered = filtered.filter(item =>
        (item.summary.userRating || item.summary.rating) >= filters.rating!
      );
    }

    setFilteredSummaries(filtered);
  }, [summaries, filters]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      tags: [],
      rating: null
    });
  };

  // Computed analytics (use filtered summaries for display)
  const total = filteredSummaries.length;
  const allSkills = flatten(filteredSummaries.map(s => s.summary.keySkills));
  const allRedFlags = flatten(filteredSummaries.map(s => s.summary.redFlags));
  const allActions = flatten(filteredSummaries.map(s => s.summary.suggestedActions));
  const ratings = filteredSummaries.map(s => s.summary.userRating || s.summary.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((acc, n) => acc + n, 0) / ratings.length) : 0;
  const allTags = flatten(filteredSummaries.map(s => s.summary.tags || []));

  const topSkills = topCount(allSkills, 5);
  const topRedFlags = topCount(allRedFlags, 5);
  const topActions = topCount(allActions, 5);
  const topTags = topCount(allTags, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <Activity className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Data</h3>
              <p className="text-red-600">{errorMsg}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your interview summary insights and trends</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <NotionSettings 
              settings={notionSettings}
              onSettingsChange={setNotionSettings}
            />
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <SummaryFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={<FileText className="h-5 w-5" />} 
            label="Total Summaries" 
            value={`${total}${summaries.length !== total ? ` of ${summaries.length}` : ''}`}
            trend="up"
            trendValue="+12% this month"
            color="blue"
          />
          <StatCard 
            icon={<Star className="h-5 w-5" />} 
            label="Average Rating" 
            value={avgRating.toFixed(1)} 
            trend="up"
            trendValue="+0.2 from last month"
            color="orange"
          />
          <StatCard 
            icon={<Users className="h-5 w-5" />} 
            label="Top Skill" 
            value={topSkills[0]?.name || "N/A"}
            color="green"
          />
          <StatCard 
            icon={<Flag className="h-5 w-5" />} 
            label="Red Flags Detected" 
            value={allRedFlags.length}
            color="red"
          />
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <ListCard 
            icon={<TrendingUp className="h-5 w-5" />} 
            label="Most Mentioned Skills" 
            items={topSkills}
            color="green"
          />
          <ListCard 
            icon={<Flag className="h-5 w-5" />} 
            label="Common Red Flags" 
            items={topRedFlags}
            color="red"
          />
          <ListCard 
            icon={<BarChart3 className="h-5 w-5" />} 
            label="Suggested Actions" 
            items={topActions}
            color="purple"
          />
          <ListCard 
            icon={<Filter className="h-5 w-5" />} 
            label="Popular Tags" 
            items={topTags}
            color="blue"
          />
        </div>

        {/* Empty State */}
        {summaries.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Start summarizing your interview conversations to see analytics and insights here.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Get Started
              </button>
            </CardContent>
          </Card>
        )}

        {/* No Results State for Filters */}
        {summaries.length > 0 && filteredSummaries.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Filter className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Matching Results</h3>
              <p className="text-gray-500 mb-4">
                No summaries match your current filters. Try adjusting your search criteria.
              </p>
              <button 
                onClick={handleClearFilters}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
