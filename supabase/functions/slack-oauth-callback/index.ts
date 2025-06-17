
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('slack-oauth-callback function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Handle both URL params and body data
    let code, state, error;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      error = url.searchParams.get('error');
    } else {
      const body = await req.json();
      code = body.code;
      state = body.state;
      error = body.error;
    }

    console.log('OAuth callback parameters:', {
      hasCode: !!code,
      hasState: !!state,
      error: error,
      codeLength: code?.length || 0
    });

    if (error) {
      console.error('Slack OAuth error:', error);
      return new Response(
        JSON.stringify({ error: `Slack OAuth error: ${error}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!code) {
      console.error('Authorization code not found');
      return new Response(
        JSON.stringify({ error: 'Authorization code not found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Slack credentials from environment
    const clientId = Deno.env.get('SLACK_CLIENT_ID')
    const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET')
    const redirectUri = Deno.env.get('SLACK_REDIRECT_URL')

    console.log('Environment variables check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0
    });

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Slack configuration for token exchange');
      return new Response(
        JSON.stringify({ error: 'Missing Slack configuration' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Exchange authorization code for access token
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', {
      ok: tokenData.ok,
      team: tokenData.team?.name,
      error: tokenData.error,
      hasAccessToken: !!tokenData.access_token
    });

    if (!tokenData.ok) {
      console.error('Slack OAuth token exchange error:', tokenData)
      return new Response(
        JSON.stringify({ error: `Failed to exchange token: ${tokenData.error}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    console.log('Supabase config:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey
    });
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store the token in database
    console.log('Storing token in database...');
    const { error: dbError } = await supabase
      .from('slack_tokens')
      .upsert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        user_id: tokenData.authed_user.id,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'team_id,user_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: `Failed to store token: ${dbError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Token stored successfully');
    
    // Return success data
    return new Response(
      JSON.stringify({
        success: true,
        team: {
          id: tokenData.team.id,
          name: tokenData.team.name
        },
        user: {
          id: tokenData.authed_user.id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
