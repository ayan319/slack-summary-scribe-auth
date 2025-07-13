// API Types for Slack Summary Scribe
// This file contains all TypeScript interfaces for API requests and responses

// Base API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

// Request Body Types
export interface ApiRequestBody {
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Dashboard API Types
export interface DashboardData {
  summaries: Summary[];
  analytics: AnalyticsOverview;
  recentActivity: ActivityItem[];
  notifications: NotificationItem[];
  slackStatus: SlackConnectionStatus;
}

export interface Summary {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  workspace_id: string;
  quality_score?: number;
  ai_model?: string;
  source_type: 'slack' | 'upload' | 'manual';
  metadata?: Record<string, unknown>;
  skills_detected?: string[];
  red_flags?: string[];
  actions?: string[];
  tags?: string[];
}

export interface AnalyticsOverview {
  total_summaries: number;
  total_ai_requests: number;
  total_file_uploads: number;
  total_exports: number;
  avg_quality_score: number;
  summaries_trend: number;
  current_plan: string;
  plan_usage: PlanUsage;
}

export interface PlanUsage {
  summaries_used: number;
  summaries_limit: number;
  ai_requests_used: number;
  ai_requests_limit: number;
  uploads_used: number;
  uploads_limit: number;
}

export interface ActivityItem {
  id: string;
  type: 'summary_created' | 'file_uploaded' | 'export_generated' | 'slack_connected';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export interface SlackConnectionStatus {
  connected: boolean;
  team_name?: string;
  team_id?: string;
  user_name?: string;
  last_sync?: string;
  channels_count?: number;
}

// Analytics API Types
export interface AnalyticsMetrics {
  overview: AnalyticsOverview;
  usage_trends: UsageTrend[];
  quality_metrics: QualityMetric[];
  export_stats: ExportStats;
  ai_model_usage: AIModelUsage[];
}

export interface UsageTrend {
  date: string;
  summaries: number;
  ai_requests: number;
  uploads: number;
  exports: number;
}

export interface QualityMetric {
  date: string;
  avg_score: number;
  total_summaries: number;
  score_distribution: ScoreDistribution;
}

export interface ScoreDistribution {
  excellent: number; // 0.9-1.0
  good: number;      // 0.7-0.89
  fair: number;      // 0.5-0.69
  poor: number;      // 0-0.49
}

export interface ExportStats {
  total_exports: number;
  export_types: {
    pdf: number;
    excel: number;
    notion: number;
    crm: number;
  };
  recent_exports: RecentExport[];
}

export interface RecentExport {
  id: string;
  type: 'pdf' | 'excel' | 'notion' | 'crm';
  title: string;
  created_at: string;
  file_size?: number;
  download_url?: string;
}

export interface AIModelUsage {
  model: string;
  requests: number;
  success_rate: number;
  avg_response_time: number;
  cost?: number;
}

// Upload API Types
export interface UploadRequest {
  file: File;
  workspace_id?: string;
  auto_summarize?: boolean;
  ai_model?: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  upload_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary_id?: string;
}

export interface UploadStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  summary?: Summary;
}

// Slack API Types
export interface SlackAuthRequest {
  code: string;
  state?: string;
}

export interface SlackAuthResponse {
  access_token: string;
  team_id: string;
  team_name: string;
  user_id: string;
  user_name: string;
  scope: string;
}

export interface SlackSummarizeRequest {
  channel_id: string;
  start_date?: string;
  end_date?: string;
  message_count?: number;
  ai_model?: string;
}

// Teams/Organizations API Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  ai_model_preference?: string;
  auto_summarize?: boolean;
  notification_preferences?: NotificationPreferences;
  export_settings?: ExportSettings;
  slack_settings?: SlackSettings;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  slack_notifications: boolean;
  in_app_notifications: boolean;
  summary_completed: boolean;
  export_ready: boolean;
  quota_warnings: boolean;
}

export interface ExportSettings {
  default_format: 'pdf' | 'excel' | 'notion';
  include_metadata: boolean;
  auto_export: boolean;
}

export interface SlackSettings {
  auto_sync: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  channels_to_monitor: string[];
  exclude_bots: boolean;
}

// User API Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  ai_model_preference: string;
}

// Subscription API Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
}

export interface PlanLimits {
  summaries_per_month: number;
  ai_requests_per_month: number;
  file_uploads_per_month: number;
  exports_per_month: number;
  workspaces: number;
  team_members: number;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  responseTime: string;
  environment: string;
  version: string;
  checks: HealthChecks;
}

export interface HealthChecks {
  environment: HealthCheckItem;
  database: HealthCheckItem;
  ai_service: HealthCheckItem;
  email_service: HealthCheckItem;
  storage: HealthCheckItem;
}

export interface HealthCheckItem {
  status: 'ok' | 'error';
  details?: Record<string, unknown>;
  error?: string;
}
