
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code) {
      return new Response('Authorization code not found', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get Slack credentials from environment
    const clientId = Deno.env.get('SLACK_CLIENT_ID')
    const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET')
    const redirectUri = Deno.env.get('SLACK_REDIRECT_URL')

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response('Missing Slack configuration', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Exchange authorization code for access token
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

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData)
      return new Response('Failed to exchange token', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store the token in database
    const { error } = await supabase
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

    if (error) {
      console.error('Database error:', error)
      return new Response('Failed to store token', { 
        status: 500,
        headers: corsHeaders 
      })
    }

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
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
