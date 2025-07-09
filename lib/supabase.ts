import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!supabaseServiceKey && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found - admin operations will be disabled');
}

// Singleton pattern to prevent multiple GoTrueClient warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Client-side Supabase client (for public operations)
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
})();

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Create Supabase client for Server Components
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Simple createClient function for API routes
export const createSupabaseClient = () => supabase;

// Create Supabase client for API routes
export const createRouteHandlerClient = (request: NextRequest, response: NextResponse) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });
};

// Database types (will be auto-generated in production)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          provider: string | null;
          provider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          provider?: string | null;
          provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          provider?: string | null;
          provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          avatar_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          avatar_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          avatar_url?: string | null;
          created_by?: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
      };
      summaries: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          title: string;
          content: string;
          channel_name: string;
          channel_id: string;
          message_count: number;
          slack_team_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          title: string;
          content: string;
          channel_name: string;
          channel_id: string;
          message_count: number;
          slack_team_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          title?: string;
          content?: string;
          channel_name?: string;
          channel_id?: string;
          message_count?: number;
          slack_team_id?: string;
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
          scope: string;
          connected: boolean;
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
          scope: string;
          connected?: boolean;
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
          scope?: string;
          connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Typed Supabase clients
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;
