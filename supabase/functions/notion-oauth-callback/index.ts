
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const NOTION_CLIENT_ID = Deno.env.get("NOTION_CLIENT_ID")
const NOTION_CLIENT_SECRET = Deno.env.get("NOTION_CLIENT_SECRET")
const REDIRECT_URI = Deno.env.get("NOTION_REDIRECT_URI")

serve(async (req) => {
  try {
    const {searchParams} = new URL(req.url)
    const code = searchParams.get("code")
    if (!code) {
      return new Response("Code required", { status: 400 })
    }

    // Exchange code for token
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`),
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })
    const data = await response.json()
    if (!data.access_token) {
      return new Response("OAuth failed:" + JSON.stringify(data), { status: 400 })
    }
    // Return access_token as response (frontend must store securely per user)
    return new Response(JSON.stringify({ access_token: data.access_token, bot_id: data.bot_id }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response("OAuth error: " + String(err), { status: 500 })
  }
})
