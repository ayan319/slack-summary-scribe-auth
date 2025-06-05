
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
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    console.log('OAuth callback parameters:', {
      hasCode: !!code,
      hasState: !!state,
      error: error,
      codeLength: code?.length || 0
    });

    if (error) {
      console.error('Slack OAuth error:', error);
      return new Response(
        null,
        {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${url.origin}/auth/error?error=${encodeURIComponent(error)}`,
          },
        }
      )
    }

    if (!code) {
      console.error('Authorization code not found');
      return new Response('Authorization code not found', { 
        status: 400,
        headers: corsHeaders 
      })
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
      return new Response('Missing Slack configuration', { 
        status: 500,
        headers: corsHeaders 
      })
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
      return new Response(`Failed to exchange token: ${tokenData.error}`, { 
        status: 400,
        headers: corsHeaders 
      })
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
        bot_user_id: tokenData.bot_user_id,
        app_id: tokenData.app_id,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'team_id,user_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(`Failed to store token: ${dbError.message}`, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log('Token stored successfully, redirecting...');
    
    // Redirect back to frontend with success
    const frontendUrl = `${url.origin}/auth/success?team=${encodeURIComponent(tokenData.team.name)}`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': frontendUrl,
      },
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
