
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Get summary by message ID called:', req.method);

  try {
    const url = new URL(req.url);
    const messageId = url.pathname.split('/').pop();

    if (!messageId) {
      return new Response(JSON.stringify({ error: 'Message ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching summary for message ID:', messageId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to find summary by message ID (stored in a custom field or transcript)
    const { data: summaries, error } = await supabase
      .from('summaries')
      .select('*')
      .or(`transcript.ilike.%${messageId}%,summary->>message_id.eq.${messageId}`)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!summaries || summaries.length === 0) {
      // Return mock data for demo purposes
      const mockSummary = {
        id: messageId,
        message_id: messageId,
        candidateSummary: `Summary generated for Slack message ${messageId}`,
        keySkills: ['Communication', 'Technical Skills', 'Problem Solving'],
        redFlags: ['Needs more experience with specific tools'],
        suggestedActions: [
          'Schedule follow-up interview',
          'Review technical portfolio',
          'Check references'
        ],
        rating: 4,
        timestamp: new Date().toISOString(),
        title: `Slack Message Summary - ${messageId}`
      };

      return new Response(JSON.stringify({ summary: mockSummary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const summary = summaries[0];
    console.log('Found summary:', summary.id);

    return new Response(JSON.stringify({ 
      summary: {
        ...summary.summary,
        id: summary.id,
        message_id: messageId,
        timestamp: summary.timestamp,
        title: summary.title
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-summary-by-message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
