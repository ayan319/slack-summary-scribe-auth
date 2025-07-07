import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, History, FileText } from "lucide-react";
import { SummaryData, HistoryItem } from "@/src/types/summary";
import { TranscriptInput } from "./TranscriptInput";
import { SummaryResult } from "./SummaryResult";
import { TranscriptHistory } from "./TranscriptHistory";
import { useUserSummaries } from "@/src/hooks/useUserSummaries";
import { supabase } from "@/lib/supabase";
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
    });

    // 2. THEN check for session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase/Local summary sync
  const { history, addHistory, clearHistory, loading, reload, updateHistory } =
    useUserSummaries(session);

  // Update summary saving logic to insert into correct storage
  const parseSummaryResponse = (response: string): SummaryData => {
    // Parse the backend response string into structured data
    const sections = response.split("\n\n");

    let candidateSummary = "";
    let keySkills: string[] = [];
    let redFlags: string[] = [];
    let suggestedActions: string[] = [];
    let rating = 0;

    sections.forEach((section) => {
      if (
        section.includes("Candidate Summary:") ||
        section.includes("Summary:")
      ) {
        candidateSummary = section.replace(/.*Summary:\s*/, "").trim();
      } else if (
        section.includes("Key Skills:") ||
        section.includes("Skills:")
      ) {
        const skillsText = section.replace(/.*Skills:\s*/, "").trim();
        keySkills = skillsText
          .split("\n")
          .map((skill) => skill.replace(/^-\s*/, "").trim())
          .filter(Boolean);
      } else if (
        section.includes("Red Flags:") ||
        section.includes("Concerns:")
      ) {
        const flagsText = section
          .replace(/.*(?:Red Flags|Concerns):\s*/, "")
          .trim();
        redFlags = flagsText
          .split("\n")
          .map((flag) => flag.replace(/^-\s*/, "").trim())
          .filter(Boolean);
      } else if (
        section.includes("Suggested Actions:") ||
        section.includes("Recommendations:")
      ) {
        const actionsText = section
          .replace(/.*(?:Suggested Actions|Recommendations):\s*/, "")
          .trim();
        suggestedActions = actionsText
          .split("\n")
          .map((action) => action.replace(/^-\s*/, "").trim())
          .filter(Boolean);
      } else if (section.includes("Rating:") || section.includes("Score:")) {
        const ratingMatch = section.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
      }
    });

    return {
      candidateSummary: candidateSummary || "No summary available",
      keySkills: keySkills.length > 0 ? keySkills : ["No skills identified"],
      redFlags: redFlags.length > 0 ? redFlags : ["No red flags identified"],
      suggestedActions:
        suggestedActions.length > 0
          ? suggestedActions
          : ["No specific actions suggested"],
      rating: rating || 0,
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
      const data = await response.text();
      const parsedSummary = parseSummaryResponse(data);
      setSummary(parsedSummary);

      await addHistory({
        transcript,
        summary: parsedSummary,
        timestamp: new Date(),
        title: `Analysis - ${new Date().toLocaleDateString()}`,
      });

      toast({
        title: "Summary Generated",
        description: "Your transcript has been summarized successfully.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during summarization.";
      toast({
        title: "Summarization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: "slack" | "notion" | "crm") => {
    // This is now handled by the SummaryResult component's real export functions
    console.log(`Export to ${type} will be handled by real API integration`);
  };

  const handleSummaryUpdate = async (updatedSummary: SummaryData) => {
    setSummary(updatedSummary);
    // Update in history if this summary exists
    if (history.length > 0) {
      const currentHistoryItem = history.find(
        (item) =>
          item.transcript === transcript &&
          item.summary.candidateSummary === updatedSummary.candidateSummary,
      );
      if (currentHistoryItem && updateHistory) {
        await updateHistory({
          ...currentHistoryItem,
          summary: updatedSummary,
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 lg:py-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-8">
        Slack Summary Scribe
      </h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="summarize" className="text-sm lg:text-base">
            <FileText className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Summarize</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm lg:text-base">
            <History className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="text-sm lg:text-base">
            <User className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summarize">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <TranscriptInput
              transcript={transcript}
              setTranscript={setTranscript}
              onSummarize={handleSummarize}
              isLoading={isLoading}
            />
            <SummaryResult
              summary={summary}
              isLoading={isLoading}
              handleExport={handleExport}
              transcript={transcript}
              onSummaryUpdate={handleSummaryUpdate}
            />
          </div>
        </TabsContent>
        <TabsContent value="history">
          <TranscriptHistory
            history={history}
            onClearHistory={clearHistory}
            isLoading={loading}
            onLoadItem={(item) => {
              setTranscript(item.transcript);
              setSummary(item.summary);
              setActiveTab("summarize");
            }}
            onReload={reload}
            onUpdateItem={updateHistory}
          />
        </TabsContent>
        <TabsContent value="account">
          <div className="p-4 border rounded-md max-w-md mx-auto lg:max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Account Information</h3>
            {session ? (
              <div className="space-y-4">
                <p className="text-sm lg:text-base">
                  Welcome, {session.user.email}!
                </p>
                <Button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm lg:text-base">You are not logged in.</p>
                <Button
                  onClick={() =>
                    supabase.auth.signInWithOAuth({ provider: "github" })
                  }
                  className="w-full"
                >
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
