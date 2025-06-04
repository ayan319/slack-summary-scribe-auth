
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('slack-auth-url function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientId = Deno.env.get('SLACK_CLIENT_ID')
    const redirectUri = Deno.env.get('SLACK_REDIRECT_URL')

    console.log('Environment check:', {
      hasClientId: !!clientId,
      hasRedirectUri: !!redirectUri,
      redirectUri: redirectUri
    });

    if (!clientId || !redirectUri) {
      console.error('Missing Slack configuration:', {
        clientId: !!clientId,
        redirectUri: !!redirectUri
      });
      return new Response(
        JSON.stringify({ error: 'Missing Slack configuration' }), 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Define required scopes for your summarizer app
    const scopes = [
      'channels:read',
      'channels:history',
      'groups:read',
      'groups:history',
      'chat:write',
      'users:read',
      'team:read'
    ].join(',')

    // Generate a random state parameter for CSRF protection
    const state = crypto.randomUUID()
    console.log('Generated state:', state);

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

    console.log('Generated auth URL:', authUrl);

    return new Response(
      JSON.stringify({ url: authUrl, state }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Auth URL generation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    )
  }
})
