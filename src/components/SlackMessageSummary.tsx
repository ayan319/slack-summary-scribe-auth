
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { SummaryData } from '@/types/summary';

interface SlackMessageSummaryData extends SummaryData {
  id: string;
  message_id: string;
  timestamp: string;
  title: string;
}

const SlackMessageSummary = () => {
  const [messageId, setMessageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SlackMessageSummaryData | null>(null);
  const { toast } = useToast();

  const fetchSummaryByMessageId = async () => {
    if (!messageId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSummary(null);

    try {
      console.log('Fetching summary for message ID:', messageId);
      
      const { data, error } = await supabase.functions.invoke('get-summary-by-message', {
        body: { messageId: messageId.trim() }
      });

      if (error) {
        console.error('Error fetching summary:', error);
        throw error;
      }

      console.log('Summary response:', data);
      
      if (data?.summary) {
        setSummary(data.summary);
        toast({
          title: "Success",
          description: "Summary loaded successfully",
        });
      } else {
        toast({
          title: "Not Found",
          description: "No summary found for this message ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast({
        title: "Error",
        description: "Failed to fetch summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummaryByMessageId();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Slack Message Summary</span>
          </CardTitle>
          <CardDescription>
            Enter a Slack message ID to view its summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Slack message ID (e.g., 1234567890.123456)"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Get Summary'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{summary.title}</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < summary.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {summary.rating}/5
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              Message ID: {summary.message_id} • {new Date(summary.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Candidate Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{summary.candidateSummary}</p>
            </div>

            {/* Key Skills */}
            {summary.keySkills && summary.keySkills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Key Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.keySkills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags */}
            {summary.redFlags && summary.redFlags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                  Red Flags
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {summary.redFlags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Actions */}
            {summary.suggestedActions && summary.suggestedActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Suggested Actions</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {summary.suggestedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SlackMessageSummary;
