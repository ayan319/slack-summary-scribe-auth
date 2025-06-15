import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, History, FileText } from "lucide-react";
import { SummaryData, HistoryItem } from "@/types/summary";
import { TranscriptInput } from "./TranscriptInput";
import { SummaryResult } from "./SummaryResult";
import { TranscriptHistory } from "./TranscriptHistory";
import { useUserSummaries } from "@/hooks/useUserSummaries";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const SummarizeBox = () => {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summarize");
  const [session, setSession] = useState<Session | null>(null);

  const { toast } = useToast();

  // Auth: Listen for user login/logout and keep session up-to-date
  useEffect(() => {
    // 1. Setup listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
    });

    // 2. THEN check for session
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase/Local summary sync
  const { history, addHistory, clearHistory, loading, reload } = useUserSummaries(session);

  // Update summary saving logic to insert into correct storage
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
    setSummary(null);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize");
      }
      const data = await response.text(); // Get raw text response
      const parsedSummary = parseSummaryResponse(data); // Parse it
      setSummary(parsedSummary);
      addHistory({ transcript, summary: parsedSummary, timestamp: new Date().toISOString() });
      toast({
        title: "Summary Generated",
        description: "Your transcript has been summarized successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Summarization Failed",
        description: err.message || "An unknown error occurred during summarization.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: "slack" | "notion" | "crm") => {
    // Simulate export with a mock endpoint or dummy delay
    try {
      // Replace with real endpoints as needed
      await new Promise(res => setTimeout(res, 600));
      toast({
        title: "Export Successful",
        description: `Summary exported to ${type.charAt(0).toUpperCase() + type.slice(1)}!`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: `Could not export to ${type}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Slack Summary Scribe</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summarize">
            <FileText className="mr-2 h-4 w-4" /> Summarize
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summarize">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TranscriptInput
              transcript={transcript}
              setTranscript={setTranscript}
              handleSummarize={handleSummarize}
              isLoading={isLoading}
            />
            <SummaryResult
              summary={summary}
              isLoading={isLoading}
              handleExport={handleExport} // Pass handleExport to SummaryResult
            />
          </div>
        </TabsContent>
        <TabsContent value="history">
          <TranscriptHistory
            history={history}
            clearHistory={clearHistory}
            isLoading={loading}
            onSelectHistoryItem={(item) => {
              setTranscript(item.transcript);
              setSummary(item.summary);
              setActiveTab("summarize");
            }}
          />
        </TabsContent>
        <TabsContent value="account">
          <div className="p-4 border rounded-md">
            <h3 className="text-xl font-semibold mb-4">Account Information</h3>
            {session ? (
              <div>
                <p>Welcome, {session.user.email}!</p>
                <Button onClick={() => supabase.auth.signOut()} className="mt-4">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div>
                <p>You are not logged in.</p>
                <Button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="mt-4">
                  Login with GitHub
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SummarizeBox;
