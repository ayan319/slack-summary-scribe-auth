
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, History, FileText } from 'lucide-react';
import { SummaryData, HistoryItem } from '../types/summary';
import { TranscriptInput } from './TranscriptInput';
import { SummaryResult } from './SummaryResult';
import { TranscriptHistory } from './TranscriptHistory';

const SummarizeBox = () => {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('summarize');
  const { toast } = useToast();

  // Load history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('summaryHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
    }
  }, []);

  // Save history to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem('summaryHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
    }
  }, [history]);

  const parseSummaryResponse = (response: string): SummaryData => {
    // Parse the backend response string into structured data
    const sections = response.split('\n\n');
    
    let candidateSummary = '';
    let keySkills: string[] = [];
    let redFlags: string[] = [];
    let suggestedActions: string[] = [];
    let rating = 0;

    sections.forEach(section => {
      if (section.includes('Candidate Summary:') || section.includes('Summary:')) {
        candidateSummary = section.replace(/.*Summary:\s*/, '').trim();
      } else if (section.includes('Key Skills:') || section.includes('Skills:')) {
        const skillsText = section.replace(/.*Skills:\s*/, '').trim();
        keySkills = skillsText.split('\n').map(skill => skill.replace(/^-\s*/, '').trim()).filter(Boolean);
      } else if (section.includes('Red Flags:') || section.includes('Concerns:')) {
        const flagsText = section.replace(/.*(?:Red Flags|Concerns):\s*/, '').trim();
        redFlags = flagsText.split('\n').map(flag => flag.replace(/^-\s*/, '').trim()).filter(Boolean);
      } else if (section.includes('Suggested Actions:') || section.includes('Recommendations:')) {
        const actionsText = section.replace(/.*(?:Suggested Actions|Recommendations):\s*/, '').trim();
        suggestedActions = actionsText.split('\n').map(action => action.replace(/^-\s*/, '').trim()).filter(Boolean);
      } else if (section.includes('Rating:') || section.includes('Score:')) {
        const ratingMatch = section.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
      }
    });

    return {
      candidateSummary: candidateSummary || 'No summary available',
      keySkills: keySkills.length > 0 ? keySkills : ['No skills identified'],
      redFlags: redFlags.length > 0 ? redFlags : ['No red flags identified'],
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : ['No specific actions suggested'],
      rating: rating || 0
    };
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcript provided",
        description: "Please enter or upload a transcript to summarize",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate summary');
      }

      const data = await response.text();
      
      if (!data || data.trim() === '') {
        toast({
          title: "No summary returned",
          description: "The API returned an empty response. Please try again.",
          variant: "destructive",
        });
        setSummary(null);
        return;
      }

      const parsedSummary = parseSummaryResponse(data);
      setSummary(parsedSummary);

      // Add to history (limit to last 10 items)
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        transcript,
        summary: parsedSummary,
        title: `Interview Summary - ${new Date().toLocaleDateString()}`
      };
      
      setHistory(prev => [historyItem, ...prev].slice(0, 10));
      
      toast({
        title: "Summary generated successfully!",
        description: "Your interview has been analyzed",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
      toast({
        title: "Error generating summary",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setTranscript(item.transcript);
    setSummary(item.summary);
    setActiveTab('summarize');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Interview Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Transform interview transcripts into actionable insights
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summarize" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Analyze Interview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summarize" className="space-y-6">
            <TranscriptInput
              transcript={transcript}
              setTranscript={setTranscript}
              isLoading={isLoading}
              onSummarize={handleSummarize}
            />
            <SummaryResult summary={summary} />
          </TabsContent>

          <TabsContent value="history">
            <TranscriptHistory 
              history={history} 
              onLoadItem={loadFromHistory}
              onClearHistory={() => setHistory([])}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SummarizeBox;
