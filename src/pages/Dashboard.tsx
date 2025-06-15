
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, Star, TrendingUp, TrendingDown, FileText, Flag, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SummaryData } from "@/types/summary";

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

// Card components as before
const StatCard = ({
  icon,
  label,
  value,
}: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const ListCard = ({
  icon,
  label,
  items,
}: { icon: React.ReactNode; label: string; items: { name: string; count: number }[] }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-muted-foreground text-sm">None</li>}
        {items.map((item, i) => (
          <li key={i} className="flex justify-between">
            <span>{item.name}</span>
            <span className="bg-gray-200 rounded-full px-2 py-0.5 text-xs">{item.count}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<{summary: SummaryData}[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    // Fetch summaries for current user
    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);
      // Auth required: get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setErrorMsg("You must be logged in to see your analytics.");
        setSummaries([]);
        setLoading(false);
        return;
      }
      // Fetch up to 100 recent summaries for this user
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
      } else if (!cancelled) {
        setSummaries(data || []);
      }
      setLoading(false);
    }
    fetchData();
    return () => { cancelled = true };
  }, [toast]);

  // Computed analytics
  const total = summaries.length;
  const allSkills = flatten(summaries.map(s => s.summary.keySkills));
  const allRedFlags = flatten(summaries.map(s => s.summary.redFlags));
  const allActions = flatten(summaries.map(s => s.summary.suggestedActions));
  const ratings = summaries.map(s => s.summary.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((acc, n) => acc + n, 0) / ratings.length) : 0;

  const topSkills = topCount(allSkills);
  const topRedFlags = topCount(allRedFlags);
  const topActions = topCount(allActions);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-2 space-y-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <div className="text-center py-16 text-lg text-muted-foreground">Loading analytics…</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-2 space-y-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <div className="text-center py-16 text-lg text-destructive">{errorMsg}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-2 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard icon={<FileText className="text-blue-500 h-6 w-6" />} label="Total Summaries" value={total} />
        <StatCard icon={<Star className="text-yellow-500 h-6 w-6" />} label="Avg. Rating" value={avgRating.toFixed(2)} />
        <StatCard icon={<Users className="text-green-500 h-6 w-6" />} label="Most Frequent Skill" value={topSkills[0]?.name || "N/A"} />
        <StatCard icon={<Flag className="text-red-500 h-6 w-6" />} label="Top Red Flag" value={topRedFlags[0]?.name || "None"} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <ListCard icon={<TrendingUp className="text-purple-500 h-5 w-5" />} label="Top Skills" items={topSkills} />
        <ListCard icon={<TrendingDown className="text-rose-500 h-5 w-5" />} label="Top Red Flags" items={topRedFlags} />
        <ListCard icon={<BarChart3 className="text-blue-400 h-5 w-5" />} label="Suggested Actions" items={topActions} />
      </div>
    </div>
  );
};

export default Dashboard;
