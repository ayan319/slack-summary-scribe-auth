'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star,
  Copy,
  Download,
  MoreHorizontal,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface Summary {
  id: string;
  title: string;
  content: string;
  channelName: string;
  messageCount: number;
  createdAt: string;
  rating?: number;
  tags: string[];
}

export default function ModernSummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Simulate loading demo data
    setTimeout(() => {
      setSummaries([
        {
          id: '1',
          title: 'Team Standup Summary',
          content: 'Daily standup meeting covering sprint progress, blockers, and upcoming tasks.',
          channelName: '#general',
          messageCount: 15,
          createdAt: new Date().toISOString(),
          rating: 4,
          tags: ['standup', 'sprint', 'team']
        },
        {
          id: '2',
          title: 'Product Planning Meeting',
          content: 'Strategic discussion about Q4 product roadmap and feature prioritization.',
          channelName: '#product',
          messageCount: 28,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          rating: 5,
          tags: ['product', 'planning', 'roadmap']
        },
        {
          id: '3',
          title: 'Engineering Discussion',
          content: 'Technical architecture review and implementation strategy for new features.',
          channelName: '#engineering',
          messageCount: 42,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          rating: 3,
          tags: ['engineering', 'architecture', 'technical']
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredSummaries = summaries.filter(summary => 
    summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    summary.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    summary.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Summary copied to clipboard');
  };

  const handleRating = (summaryId: string, rating: number) => {
    setSummaries(prev => prev.map(s => 
      s.id === summaryId ? { ...s, rating } : s
    ));
    toast.success(`Rated ${rating} stars`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Summary Analytics</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and analyze your conversation summaries</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredSummaries.map((summary) => (
            <Card key={summary.id} data-testid="summary-card" className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{summary.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{summary.channelName}</span>
                      <span>•</span>
                      <span>{summary.messageCount} messages</span>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{summary.content}</p>
                
                <div className="flex flex-wrap gap-1">
                  {summary.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(summary.id, star)}
                        className="text-yellow-400 hover:text-yellow-500"
                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <Star 
                          className={`h-4 w-4 ${star <= (summary.rating || 0) ? 'fill-current' : ''}`} 
                        />
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(summary.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSummaries.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No summaries found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
