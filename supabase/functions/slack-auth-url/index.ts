
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientId = Deno.env.get('SLACK_CLIENT_ID')
    const redirectUri = Deno.env.get('SLACK_REDIRECT_URL')

    if (!clientId || !redirectUri) {
      return new Response('Missing Slack configuration', { 
        status: 500,
        headers: corsHeaders 
      })
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

    // Generate a random state parameter for security
    const state = crypto.randomUUID()

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

    return new Response(
      JSON.stringify({ url: authUrl }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Auth URL generation error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
