
export interface SummaryData {
  candidateSummary: string;
  keySkills: string[];
  redFlags: string[];
  suggestedActions: string[];
  rating: number;
  handleExport?: (type: "slack" | "notion" | "crm") => void;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  transcript: string;
  summary: SummaryData;
  title: string;
}

export interface TranscriptInputProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  isLoading: boolean;
  onSummarize: () => void;
}

export interface SummaryResultProps {
  summary: SummaryData | null;
  isLoading: boolean;
  handleExport: (type: "slack" | "notion" | "crm") => void;
}

export interface TranscriptHistoryProps {
  history: HistoryItem[];
  onLoadItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  onReload?: () => void;
}
