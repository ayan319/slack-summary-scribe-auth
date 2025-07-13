import { createPagesBrowserClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: 'owner' | 'admin' | 'member'
        }
      }
      summaries: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          title: string
          content: string
          source_type: 'slack' | 'upload' | 'manual'
          source_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          title: string
          content: string
          source_type: 'slack' | 'upload' | 'manual'
          source_data?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          title?: string
          content?: string
          source_type?: 'slack' | 'upload' | 'manual'
          source_data?: any
          updated_at?: string
        }
      }
      slack_integrations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          slack_team_id: string
          slack_team_name: string
          access_token: string
          bot_user_id: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          slack_team_id: string
          slack_team_name: string
          access_token: string
          bot_user_id: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          slack_team_id?: string
          slack_team_name?: string
          access_token?: string
          bot_user_id?: string
          active?: boolean
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          type: string
          title: string
          message: string
          data: any
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          type: string
          title: string
          message: string
          data?: any
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          type?: string
          title?: string
          message?: string
          data?: any
          read_at?: string | null
        }
      }
      crm_tokens: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          crm_type: 'hubspot' | 'salesforce' | 'pipedrive'
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          instance_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          crm_type: 'hubspot' | 'salesforce' | 'pipedrive'
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          instance_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          crm_type?: 'hubspot' | 'salesforce' | 'pipedrive'
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          instance_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      onboarding_steps: {
        Row: {
          id: string
          user_id: string
          step_name: string
          is_completed: boolean
          completed_at: string | null
          step_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step_name: string
          is_completed?: boolean
          completed_at?: string | null
          step_data?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step_name?: string
          is_completed?: boolean
          completed_at?: string | null
          step_data?: any
          updated_at?: string
        }
      }
      ai_model_comparisons: {
        Row: {
          id: string
          user_id: string
          original_text: string
          deepseek_summary: string | null
          gpt4_summary: string | null
          claude_summary: string | null
          deepseek_score: number | null
          gpt4_score: number | null
          claude_score: number | null
          user_preferred_model: string | null
          comparison_metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_text: string
          deepseek_summary?: string | null
          gpt4_summary?: string | null
          claude_summary?: string | null
          deepseek_score?: number | null
          gpt4_score?: number | null
          claude_score?: number | null
          user_preferred_model?: string | null
          comparison_metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_text?: string
          deepseek_summary?: string | null
          gpt4_summary?: string | null
          claude_summary?: string | null
          deepseek_score?: number | null
          gpt4_score?: number | null
          claude_score?: number | null
          user_preferred_model?: string | null
          comparison_metadata?: any
        }
      }
    }
  }
}

// Singleton pattern for browser client
let supabaseClient: ReturnType<typeof createPagesBrowserClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: create new client each time
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // Client-side: use singleton to prevent multiple instances
  if (!supabaseClient) {
    supabaseClient = createPagesBrowserClient()
  }

  return supabaseClient
}

// Browser client for client-side operations
export const supabase = getSupabaseClient()

// Admin client for server-side operations (if service key is available)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Export the route handler client creator
export { createRouteHandlerClient }
