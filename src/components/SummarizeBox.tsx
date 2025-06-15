import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_TRANSCRIPT = "The candidate is experienced in React, Node.js, and has led teams of 5 engineers. They struggled with system design questions and lacked experience in cloud deployments. They are eager to learn and have strong communication skills.";

export default function SummarizeBox() {
  const [transcript, setTranscript] = useState(DEFAULT_TRANSCRIPT);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSummarize = async () => {
    setLoading(true);
    setError("");
    setSummary(null);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) throw new Error("Failed to summarize");
      const data = await response.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
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
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Slack Transcript Summarizer</h2>
      <textarea
        className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={5}
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        placeholder="Paste Slack transcript here..."
      />
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        onClick={handleSummarize}
        disabled={loading}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Candidate Summary</h3>
          <p className="mb-2">{summary.candidateSummary || summary.summary || "-"}</p>
          <div className="mb-2">
            <span className="font-semibold">Key Skills:</span>
            <ul className="list-disc list-inside ml-4">
              {(summary.keySkills || []).map((skill: string, idx: number) => (
                <li key={idx}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Red Flags:</span>
            <ul className="list-disc list-inside ml-4">
              {(summary.redFlags || []).map((flag: string, idx: number) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Suggested Actions:</span>
            <ul className="list-disc list-inside ml-4">
              {(summary.suggestedActions || []).map((action: string, idx: number) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-semibold">Rating:</span> {summary.rating || "-"}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleExport("slack")}>Export to Slack</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("notion")}>Export to Notion</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("crm")}>Export to CRM</Button>
          </div>
        </div>
      )}
    </div>
  );
}