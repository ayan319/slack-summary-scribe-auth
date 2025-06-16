
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Users, 
  Star, 
  Calendar,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { HistoryItem, SUMMARY_TAGS } from '@/types/summary';
import { useSummaryFilters } from '@/hooks/useSummaryFilters';

// Mock data for testing - in a real app, this would come from your backend
const MOCK_ADMIN_SUMMARIES: HistoryItem[] = [
  {
    id: '1',
    timestamp: new Date('2024-06-15T10:00:00Z'),
    transcript: 'Full interview transcript for candidate John Smith...',
    summary: {
      candidateSummary: 'Strong technical candidate with 5 years React experience',
      keySkills: ['React', 'TypeScript', 'Node.js'],
      redFlags: ['Limited testing experience'],
      suggestedActions: ['Technical deep dive on testing'],
      rating: 8,
      userRating: 4,
      tags: ['Strong Technical', 'Move Forward']
    },
    title: 'John Smith - Senior Frontend Developer',
    userEmail: 'hiring.manager@company.com',
    userName: 'Sarah Johnson'
  },
  {
    id: '2',
    timestamp: new Date('2024-06-14T14:30:00Z'),
    transcript: 'Interview transcript for candidate Jane Doe...',
    summary: {
      candidateSummary: 'Mid-level developer with good potential but needs mentoring',
      keySkills: ['JavaScript', 'Vue.js', 'CSS'],
      redFlags: ['Lacks senior-level experience', 'Communication could be clearer'],
      suggestedActions: ['Consider for junior role', 'Pair programming assessment'],
      rating: 6,
      userRating: 3,
      tags: ['Entry Level', 'Needs Improvement']
    },
    title: 'Jane Doe - Frontend Developer',
    userEmail: 'tech.lead@company.com',
    userName: 'Mike Chen'
  }
];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [summaries, setSummaries] = useState<HistoryItem[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    tags: [] as string[],
    rating: null as number | null,
    userSearch: ''
  });

  const filteredSummaries = useSummaryFilters(summaries, filters);

  useEffect(() => {
    // In a real app, you'd check if the user is an admin
    // For demo purposes, we'll use the admin toggle
    if (isAdminMode) {
      setSummaries(MOCK_ADMIN_SUMMARIES);
    } else {
      setSummaries([]);
    }
  }, [isAdminMode]);

  const handleDeleteSummary = (id: string) => {
    setSummaries(prev => prev.filter(summary => summary.id !== id));
    toast({
      title: "Summary Deleted",
      description: "The summary has been permanently deleted.",
    });
  };

  const handleViewSummary = (summary: HistoryItem) => {
    // In a real app, this would open a detailed view
    toast({
      title: "Summary Details",
      description: `Viewing summary for ${summary.title}`,
    });
  };

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

  if (!isAdminMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="text-center py-12">
            <CardContent>
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
              <p className="text-gray-600 mb-6">
                This area is restricted to administrators only. Enable admin mode below for testing purposes.
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <Label htmlFor="adminToggle" className="text-sm font-medium">
                  Enable Admin Mode (Testing)
                </Label>
                <Switch
                  id="adminToggle"
                  checked={isAdminMode}
                  onCheckedChange={setIsAdminMode}
                />
              </div>

              <Badge variant="outline" className="text-sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Demo mode only - Real admin authentication would be required
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage all user summaries and interviews</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="default" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin Mode
              </Badge>
              <Switch
                checked={isAdminMode}
                onCheckedChange={setIsAdminMode}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search summaries..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by user..."
                  value={filters.userSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, userSearch: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select 
                  value={filters.rating?.toString() || 'all'} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    rating: value === 'all' ? null : parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="8">8+ Rating</SelectItem>
                    <SelectItem value="6">6+ Rating</SelectItem>
                    <SelectItem value="4">4+ Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', tags: [], rating: null, userSearch: '' })}
              >
                Clear Filters
              </Button>
            </div>

            {/* Tag filters */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</p>
              <div className="flex flex-wrap gap-2">
                {SUMMARY_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter(t => t !== tag)
                        : [...prev.tags, tag]
                    }))}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaries.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(summaries.map(s => s.userEmail)).size}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaries.length > 0 
                  ? (summaries.reduce((acc, s) => acc + s.summary.rating, 0) / summaries.length).toFixed(1)
                  : 'N/A'
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaries.filter(s => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return s.timestamp > weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summaries List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All User Summaries
            </CardTitle>
            <CardDescription>
              {filteredSummaries.length} of {summaries.length} summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSummaries.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No summaries found</h3>
                <p className="text-gray-500">
                  {summaries.length === 0 
                    ? "No summaries have been created yet." 
                    : "Try adjusting your filters to see more results."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSummaries.map((summary) => (
                  <div key={summary.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{summary.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {summary.userName} ({summary.userEmail})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(summary.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getRatingColor(summary.summary.rating)}>
                        <Star className="h-3 w-3 mr-1" />
                        {summary.summary.rating}/10
                      </Badge>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {summary.summary.candidateSummary}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {summary.summary.tags?.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(summary.summary.tags?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(summary.summary.tags?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSummary(summary)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSummary(summary.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
