// Dashboard constants and types
export interface DashboardStats {
  totalSummaries: number;
  slackIntegrations: number;
  summariesThisMonth: number;
  teamMembers: number;
}

export interface SlackIntegration {
  id: string;
  slack_team_name: string;
  connected: boolean;
  created_at: string;
}

export interface RecentSummary {
  id: string;
  title: string;
  channel_name: string;
  created_at: string;
  message_count: number;
}
