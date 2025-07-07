import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/global';

// Create Supabase client with service role for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Types for our enhanced schema
export interface SummaryData {
  id?: string;
  user_id: string;
  team_id?: string;
  title?: string;
  summary_text: string;
  summary: {
    text: string;
    skills?: string[];
    redFlags?: string[];
    actions?: string[];
    sentiment?: string;
    urgency?: string;
    participants?: string[];
    speakerCount?: number;
  };
  skills_detected?: string[];
  red_flags?: string[];
  actions?: string[];
  tags?: string[];
  source?: 'slack' | 'manual' | 'api';
  raw_transcript: string;
  slack_channel?: string;
  slack_message_ts?: string;
  slack_thread_ts?: string;
  confidence_score?: number;
  processing_time_ms?: number;
  ai_model?: string;
  notion_status?: 'pending' | 'success' | 'failed';
  notion_page_id?: string;
  notion_exported_at?: string;
  metadata?: Record<string, any>;
}

export interface SummaryFilters {
  userId?: string;
  teamId?: string;
  source?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface SummaryResponse {
  id: string;
  user_id: string;
  team_id: string | null;
  title: string | null;
  summary_text: string;
  summary: {
    text: string;
    skills?: string[];
    redFlags?: string[];
    actions?: string[];
    sentiment?: string;
    urgency?: string;
    participants?: string[];
    speakerCount?: number;
  };
  skills_detected: string[];
  red_flags: string[];
  actions: string[];
  tags: string[];
  source: string;
  raw_transcript: string;
  slack_channel: string | null;
  slack_message_ts: string | null;
  confidence_score: number | null;
  ai_model: string | null;
  created_at: string;
  updated_at: string;
}

// Database helper functions
export class SummaryDatabase {
  /**
   * Create a new summary in the database
   */
  static async createSummary(data: SummaryData): Promise<{ data: SummaryResponse | null; error: string | null }> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from('summaries')
        .insert({
          user_id: data.user_id,
          team_id: data.team_id,
          title: data.title,
          summary_text: data.summary_text,
          summary: data.summary,
          skills_detected: data.skills_detected || [],
          red_flags: data.red_flags || [],
          actions: data.actions || [],
          tags: data.tags || [],
          source: data.source || 'api',
          raw_transcript: data.raw_transcript,
          slack_channel: data.slack_channel,
          slack_message_ts: data.slack_message_ts,
          slack_thread_ts: data.slack_thread_ts,
          confidence_score: data.confidence_score,
          processing_time_ms: data.processing_time_ms,
          ai_model: data.ai_model,
          metadata: data.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating summary:', error);
        return { data: null, error: error.message };
      }

      return { data: result as SummaryResponse, error: null };
    } catch (error) {
      console.error('Unexpected error creating summary:', error);
      return { data: null, error: 'Failed to create summary' };
    }
  }

  /**
   * Get summaries with filtering and pagination
   */
  static async getSummaries(filters: SummaryFilters = {}): Promise<{ data: SummaryResponse[] | null; error: string | null; count?: number }> {
    try {
      let query = supabaseAdmin
        .from('summaries')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply search if provided
      if (filters.search) {
        query = query.textSearch('summary_text', filters.search);
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error fetching summaries:', error);
        return { data: null, error: error.message };
      }

      return { data: data as SummaryResponse[], error: null, count: count || 0 };
    } catch (error) {
      console.error('Unexpected error fetching summaries:', error);
      return { data: null, error: 'Failed to fetch summaries' };
    }
  }

  /**
   * Get a single summary by ID
   */
  static async getSummaryById(id: string): Promise<{ data: SummaryResponse | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('summaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Database error fetching summary:', error);
        return { data: null, error: error.message };
      }

      return { data: data as SummaryResponse, error: null };
    } catch (error) {
      console.error('Unexpected error fetching summary:', error);
      return { data: null, error: 'Failed to fetch summary' };
    }
  }

  /**
   * Update a summary
   */
  static async updateSummary(id: string, updates: Partial<SummaryData>): Promise<{ data: SummaryResponse | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('summaries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database error updating summary:', error);
        return { data: null, error: error.message };
      }

      return { data: data as SummaryResponse, error: null };
    } catch (error) {
      console.error('Unexpected error updating summary:', error);
      return { data: null, error: 'Failed to update summary' };
    }
  }

  /**
   * Delete a summary
   */
  static async deleteSummary(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseAdmin
        .from('summaries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error deleting summary:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting summary:', error);
      return { error: 'Failed to delete summary' };
    }
  }

  /**
   * Search summaries using full-text search
   */
  static async searchSummaries(
    searchQuery: string,
    filters: SummaryFilters = {}
  ): Promise<{ data: SummaryResponse[] | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin.rpc('search_summaries', {
        search_query: searchQuery,
        user_filter: filters.userId || null,
        team_filter: filters.teamId || null,
        source_filter: filters.source || null,
        limit_count: filters.limit || 50,
        offset_count: filters.offset || 0,
      });

      if (error) {
        console.error('Database error searching summaries:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error searching summaries:', error);
      return { data: null, error: 'Failed to search summaries' };
    }
  }

  /**
   * Get summary statistics for a user or team
   */
  static async getSummaryStats(userId?: string, teamId?: string): Promise<{ data: {
    total: number;
    bySource: Record<string, number>;
    avgConfidence: number;
    topSkills: Record<string, number>;
    recentActivity: number;
  } | null; error: string | null }> {
    try {
      let query = supabaseAdmin
        .from('summaries')
        .select('source, created_at, skills_detected, confidence_score');

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error fetching stats:', error);
        return { data: null, error: error.message };
      }

      // Calculate statistics
      const stats = {
        total: data.length,
        bySource: data.reduce((acc: Record<string, number>, item) => {
          acc[item.source] = (acc[item.source] || 0) + 1;
          return acc;
        }, {}),
        avgConfidence: data.filter(item => item.confidence_score).reduce((sum, item) => sum + (item.confidence_score || 0), 0) / data.filter(item => item.confidence_score).length || 0,
        topSkills: data.flatMap(item => item.skills_detected || []).reduce((acc: Record<string, number>, skill) => {
          acc[skill] = (acc[skill] || 0) + 1;
          return acc;
        }, {}),
        recentActivity: data.filter(item => new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Unexpected error fetching stats:', error);
      return { data: null, error: 'Failed to fetch statistics' };
    }
  }
}
