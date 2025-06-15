
import React, { useState } from 'react';
import { SummaryDisplay } from './SummaryDisplay';
import { SummaryData } from '../types/summary';
// Notion integration hooks/util
import { useNotionOAuth, fetchNotionDatabases, createNotionPage } from '../hooks/useNotion';
import { toast } from "@/hooks/use-toast";

interface SummaryResultProps {
  summary: SummaryData | null;
  transcript?: string; // Pass transcript as a prop if available
}

export const SummaryResult: React.FC<SummaryResultProps> = ({ summary, transcript }) => {
  const [exporting, setExporting] = useState(false);
  const [dbSelectorOpen, setDbSelectorOpen] = useState(false);
  const [databases, setDatabases] = useState<any[]>([]);
  const [dbId, setDbId] = useState<string | null>(null);
  const notion = useNotionOAuth();

  if (!summary) {
    return null;
  }

  // Export flow
  const handleNotionExport = async () => {
    setExporting(true);
    try {
      if (!notion.getToken()) {
        // Start OAuth flow - user will complete and then should retry
        notion.startOAuth();
        setExporting(false);
        toast({ title: "Authenticate with Notion", description: "Please authenticate in the window that opened, then return and click 'Export to Notion' again.", variant: "default" });
        return;
      }
      // Fetch Notion databases
      const dbs = await fetchNotionDatabases(notion.getToken()!);
      setDatabases(dbs);
      setDbSelectorOpen(true);
      setExporting(false);
    } catch (e) {
      setExporting(false);
      toast({ title: "Notion Export Failed", description: String(e), variant: "destructive" });
    }
  };

  const handleSelectDatabase = async (databaseId: string) => {
    setDbSelectorOpen(false);
    setExporting(true);
    try {
      // Create Notion page
      await createNotionPage(
        notion.getToken()!,
        databaseId,
        "Interview Summary",
        summary,
        transcript || ""
      );
      setExporting(false);
      toast({ title: "Exported to Notion!", description: "Summary exported successfully." });
    } catch (e) {
      setExporting(false);
      toast({ title: "Failed to export to Notion", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div>
      <SummaryDisplay summary={summary} />
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleNotionExport}
          disabled={exporting}
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition font-medium disabled:opacity-50"
        >
          Export to Notion
        </button>
      </div>
      {/* DB Selector Modal */}
      {dbSelectorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Select Notion Database</h3>
            <ul className="mb-4 space-y-2 max-h-60 overflow-y-auto">
              {databases.map((db: any) => (
                <li
                  key={db.id}
                  className="border-b py-2 flex justify-between cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectDatabase(db.id)}
                >
                  <span>{db.title?.[0]?.plain_text || db.id}</span>
                  <span className="text-xs text-gray-500">{db.object}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setDbSelectorOpen(false)} className="mt-2 px-4 py-2 rounded bg-gray-100 text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
