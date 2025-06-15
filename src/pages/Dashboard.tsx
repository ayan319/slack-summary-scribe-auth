
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart3, Star, TrendingUp, TrendingDown, FileText, Flag, Users } from "lucide-react";

const dummySummaries = [
  {
    id: "1",
    summary: {
      candidateSummary: "Strong JavaScript skills, eager learner.",
      keySkills: ["JavaScript", "React", "Teamwork"],
      redFlags: ["Late projects"],
      suggestedActions: ["Offer mentorship"],
      rating: 4.5,
    }
  },
  {
    id: "2",
    summary: {
      candidateSummary: "Excellent communicator, experienced in backend.",
      keySkills: ["Communication", "Node.js", "Leadership", "React"],
      redFlags: [],
      suggestedActions: ["Invite to next round", "Project assignment"],
      rating: 4.2,
    }
  },
  {
    id: "3",
    summary: {
      candidateSummary: "Needs improvement on testing practices.",
      keySkills: ["Testing", "TypeScript", "Teamwork"],
      redFlags: ["Insufficient test coverage"],
      suggestedActions: ["Extra assignment"],
      rating: 3.9,
    }
  }
];

// Helpers for aggregates
const flatten = (arr: string[][]) => arr.reduce((a, b) => a.concat(b), []);
function topCount(list: string[], topN = 3) {
  const count: Record<string, number> = {};
  list.forEach(item => { count[item] = (count[item] || 0) + 1; });
  return Object.entries(count)
    .sort(([,a],[,b]) => b - a)
    .slice(0, topN)
    .map(([name, num]) => ({ name, count: num }));
}

const total = dummySummaries.length;
const allSkills = flatten(dummySummaries.map(s => s.summary.keySkills));
const allRedFlags = flatten(dummySummaries.map(s => s.summary.redFlags));
const allActions = flatten(dummySummaries.map(s => s.summary.suggestedActions));
const avgRating = dummySummaries.reduce((acc, s) => acc + s.summary.rating, 0) / total;

const topSkills = topCount(allSkills);
const topRedFlags = topCount(allRedFlags);
const topActions = topCount(allActions);

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
