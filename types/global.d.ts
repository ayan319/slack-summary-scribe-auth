// Global type definitions for the Slack Summary Scribe application

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      DEEPSEEK_API_KEY: string;
      RESEND_API_KEY: string;
      JWT_SECRET: string;
      NEXT_PUBLIC_APP_URL: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      SLACK_CLIENT_SECRET?: string;
      SLACK_SIGNING_SECRET?: string;
      NEXTAUTH_SECRET?: string;
      CASHFREE_APP_ID?: string;
      CASHFREE_SECRET_KEY?: string;
      CASHFREE_ENVIRONMENT?: 'TEST' | 'PRODUCTION';
      STRIPE_SECRET_KEY?: string;
      STRIPE_PUBLISHABLE_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
      POSTHOG_KEY?: string;
      POSTHOG_HOST?: string;
      SENTRY_DSN?: string;
    }
  }
}

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_organizations: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: 'owner' | 'admin' | 'member';
          permissions: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          role?: 'owner' | 'admin' | 'member';
          permissions?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          role?: 'owner' | 'admin' | 'member';
          permissions?: Record<string, any>;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          provider: string | null;
          settings: Record<string, any>;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          provider?: string | null;
          settings?: Record<string, any>;
          last_active_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          provider?: string | null;
          settings?: Record<string, any>;
          last_active_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      summaries: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          title: string | null;
          content: string;
          summary_data: Record<string, any>;
          source: 'slack' | 'upload' | 'manual';
          slack_channel: string | null;
          slack_message_ts: string | null;
          slack_thread_ts: string | null;
          file_url: string | null;
          metadata: Record<string, any>;
          tags: string[];
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          title?: string | null;
          content: string;
          summary_data?: Record<string, any>;
          source?: 'slack' | 'upload' | 'manual';
          slack_channel?: string | null;
          slack_message_ts?: string | null;
          slack_thread_ts?: string | null;
          file_url?: string | null;
          metadata?: Record<string, any>;
          tags?: string[];
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          title?: string | null;
          content?: string;
          summary_data?: Record<string, any>;
          source?: 'slack' | 'upload' | 'manual';
          slack_channel?: string | null;
          slack_message_ts?: string | null;
          slack_thread_ts?: string | null;
          file_url?: string | null;
          metadata?: Record<string, any>;
          tags?: string[];
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      slack_integrations: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          slack_team_id: string;
          slack_team_name: string;
          access_token: string;
          bot_token: string | null;
          bot_user_id: string | null;
          scope: string | null;
          webhook_url: string | null;
          is_active: boolean;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          slack_team_id: string;
          slack_team_name: string;
          access_token: string;
          bot_token?: string | null;
          bot_user_id?: string | null;
          scope?: string | null;
          webhook_url?: string | null;
          is_active?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          slack_team_id?: string;
          slack_team_name?: string;
          access_token?: string;
          bot_token?: string | null;
          bot_user_id?: string | null;
          scope?: string | null;
          webhook_url?: string | null;
          is_active?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      file_uploads: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          filename: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          upload_status: 'pending' | 'processing' | 'completed' | 'failed';
          processing_result: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          filename: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          upload_status?: 'pending' | 'processing' | 'completed' | 'failed';
          processing_result?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          filename?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          upload_status?: 'pending' | 'processing' | 'completed' | 'failed';
          processing_result?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          summary_id: string | null;
          export_type: 'pdf' | 'notion' | 'slack' | 'crm' | 'excel';
          export_data: Record<string, any>;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          file_url: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          summary_id?: string | null;
          export_type: 'pdf' | 'notion' | 'slack' | 'crm' | 'excel';
          export_data?: Record<string, any>;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          file_url?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          summary_id?: string | null;
          export_type?: 'pdf' | 'notion' | 'slack' | 'crm' | 'excel';
          export_data?: Record<string, any>;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          file_url?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          type: string;
          title: string;
          message: string;
          data: Record<string, any>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          type: string;
          title: string;
          message: string;
          data?: Record<string, any>;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          data?: Record<string, any>;
          is_read?: boolean;
          created_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          subject: string;
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          subject: string;
          description: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          subject?: string;
          description?: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_new_user_signup: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      check_workspace_health: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_users: number;
          users_with_orgs: number;
          users_without_orgs: number;
          health_percentage: number;
        }[];
      };
      audit_and_fix_users_without_orgs: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          user_email: string;
          action_taken: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Application Types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  provider?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  settings?: Record<string, any>;
  role?: 'owner' | 'admin' | 'member';
}

export interface SlackMessage {
  type: string;
  text?: string;
  user?: string;
  ts?: string;
  thread_ts?: string;
  subtype?: string;
  subtype?: string;
}

export interface SlackIntegration {
  id: string;
  slack_team_id: string;
  slack_team_name: string;
  access_token: string;
  bot_token?: string;
  is_active: boolean;
}

export interface Summary {
  id: string;
  title?: string;
  content: string;
  summary_data: Record<string, any>;
  source: 'slack' | 'upload' | 'manual';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface RateLimiter {
  checkLimit: (clientId: string) => { allowed: boolean; remaining: number; resetTime: number };
}

export interface RateLimiters {
  auth: RateLimiter;
  api: RateLimiter;
  upload: RateLimiter;
}

// Module declarations for missing packages
declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }
  
  function parse(buffer: Buffer): Promise<PDFData>;
  export = parse;
}

declare module '@playwright/test' {
  export const test: any;
  export const expect: any;
}

declare module 'mixpanel-browser' {
  interface Mixpanel {
    init(token: string, config?: any): void;
    track(event: string, properties?: any): void;
    identify(id: string): void;
    people: {
      set(properties: any): void;
    };
  }

  const mixpanel: Mixpanel;
  export default mixpanel;
}

export {};
