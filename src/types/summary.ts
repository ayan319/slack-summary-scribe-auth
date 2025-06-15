
export interface SummaryData {
  candidateSummary: string;
  keySkills: string[];
  redFlags: string[];
  suggestedActions: string[];
  rating: number;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  transcript: string;
  summary: SummaryData;
  title: string;
}
