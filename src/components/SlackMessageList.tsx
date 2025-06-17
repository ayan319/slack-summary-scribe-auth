
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Star, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { SummaryData } from '@/types/summary';

interface SlackSummary {
  id: string;
  message_id: string;
  timestamp: string;
  title: string;
  transcript: string;
  summary: SummaryData;
}

const SlackMessageList = () => {
  const [summaries, setSummaries] = useState<SlackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSlackSummaries();
  }, []);

  const fetchSlackSummaries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching summaries:', error);
        throw error;
      }

      console.log('Fetched summaries:', data);
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching Slack summaries:', error);
      toast({
        title: "Error",
        description: "Failed to load Slack message summaries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSummary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSummaries(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Summary deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting summary:', error);
      toast({
        title: "Error",
        description: "Failed to delete summary",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Recent Slack Message Summaries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading summaries...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Recent Slack Message Summaries</span>
        </CardTitle>
        <CardDescription>
          Automatically generated summaries from Slack messages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No summaries yet</h3>
            <p className="text-gray-500">Slack message summaries will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div key={summary.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{summary.title}</h4>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < summary.summary.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {summary.message_id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSummary(summary.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  {new Date(summary.timestamp).toLocaleString()}
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Summary</p>
                    <p className="text-sm text-gray-700">{summary.summary.candidateSummary}</p>
                  </div>

                  {summary.summary.keySkills && summary.summary.keySkills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        Key Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {summary.summary.keySkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.summary.redFlags && summary.summary.redFlags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                        Red Flags
                      </p>
                      <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                        {summary.summary.redFlags.map((flag, index) => (
                          <li key={index}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.summary.suggestedActions && summary.summary.suggestedActions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Suggested Actions</p>
                      <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                        {summary.summary.suggestedActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    View original message
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {summary.transcript}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlackMessageList;
