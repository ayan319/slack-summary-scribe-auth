
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('slack-test function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action } = await req.json();
    console.log('Test action requested:', action);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (action === 'test_auth') {
      // Get the most recent token from the database
      console.log('Fetching tokens from database...');
      const { data: tokens, error } = await supabase
        .from('slack_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch tokens', details: error.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Tokens found:', tokens?.length || 0);

      if (!tokens || tokens.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No Slack tokens found. Please authenticate first.',
            suggestion: 'Use the "Add to Slack" button to connect your workspace'
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const token = tokens[0];
      console.log('Testing with token for team:', token.team_name);

      // Test the Slack API by calling auth.test
      console.log('Making Slack API test call...');
      const slackResponse = await fetch('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const slackData = await slackResponse.json();
      console.log('Slack API response:', {
        ok: slackData.ok,
        user: slackData.user,
        team: slackData.team,
        error: slackData.error
      });

      if (!slackData.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'Slack API call failed', 
            details: slackData,
            suggestion: 'The stored token may be invalid. Try re-authenticating.'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Return success with team info
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Slack integration is working correctly!',
          team: {
            id: slackData.team_id,
            name: slackData.team,
            user: slackData.user,
            user_id: slackData.user_id
          },
          token_info: {
            team_name: token.team_name,
            scopes: token.scope,
            created_at: token.created_at
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action', validActions: ['test_auth'] }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Slack test error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
