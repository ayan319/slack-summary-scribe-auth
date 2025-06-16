
export interface SummaryData {
  candidateSummary: string;
  keySkills: string[];
  redFlags: string[];
  suggestedActions: string[];
  rating: number;
  userRating?: number; // 1-5 stars
  tags?: string[];
  handleExport?: (type: "slack" | "notion" | "crm") => void;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  transcript: string;
  summary: SummaryData;
  title: string;
  userRating?: number;
  tags?: string[];
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
  transcript?: string;
  onSummaryUpdate?: (summary: SummaryData) => void;
}

export interface TranscriptHistoryProps {
  history: HistoryItem[];
  onLoadItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isLoading?: boolean;
  onReload?: () => void;
  onUpdateItem?: (item: HistoryItem) => void;
}

export const SUMMARY_TAGS = [
  'Follow Up',
  'Great Fit',
  'Needs Improvement',
  'Strong Technical',
  'Cultural Fit',
  'Leadership Potential',
  'Entry Level',
  'Senior Level',
  'Reject',
  'Move Forward'
] as const;

export type SummaryTag = typeof SUMMARY_TAGS[number];
