
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Mic, 
  Send, 
  Loader2, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Star, 
  History,
  FileText,
  Download
} from 'lucide-react';
import { SummaryDisplay } from './SummaryDisplay';
import { TranscriptHistory } from './TranscriptHistory';

interface SummaryData {
  candidateSummary: string;
  keySkills: string[];
  redFlags: string[];
  suggestedActions: string[];
  rating: number;
}

interface HistoryItem {
  id: string;
  timestamp: Date;
  transcript: string;
  summary: SummaryData;
  title: string;
}

const SummarizeBox = () => {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('summarize');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTranscript(content);
        toast({
          title: "File uploaded successfully",
          description: `Loaded ${file.name}`,
        });
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
    }
  };

  const startVoiceRecording = () => {
    // Placeholder for voice recording functionality
    toast({
      title: "Voice Recording",
      description: "Voice-to-text feature coming soon!",
    });
  };

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
        throw new Error('Failed to generate summary');
      }

      const data = await response.text();
      const parsedSummary = parseSummaryResponse(data);
      setSummary(parsedSummary);

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        transcript,
        summary: parsedSummary,
        title: `Interview Summary - ${new Date().toLocaleDateString()}`
      };
      
      setHistory(prev => [historyItem, ...prev]);
      
      toast({
        title: "Summary generated successfully",
        description: "Your interview has been analyzed",
      });
    } catch (error) {
      toast({
        title: "Error generating summary",
        description: "Please try again later",
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
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Interview Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input Options */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload .txt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startVoiceRecording}
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Voice Input
                  </Button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="hidden"
                />

                <Textarea
                  placeholder="Paste your interview transcript here or upload a .txt file..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={8}
                  className="resize-none"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {transcript.length} characters
                  </span>
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || !transcript.trim()}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isLoading ? 'Analyzing...' : 'Analyze Interview'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Display */}
            {summary && <SummaryDisplay summary={summary} />}
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
