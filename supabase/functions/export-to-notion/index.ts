
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
    const { summary, transcript, databaseId } = await req.json()
    
    // Get Notion integration token from environment
    const notionToken = Deno.env.get('NOTION_INTEGRATION_TOKEN')
    const defaultDatabaseId = Deno.env.get('NOTION_DATABASE_ID')
    
    if (!notionToken) {
      return new Response(
        JSON.stringify({ error: 'Notion integration not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const targetDatabaseId = databaseId || defaultDatabaseId
    
    if (!targetDatabaseId) {
      return new Response(
        JSON.stringify({ error: 'No Notion database ID provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Notion page
    const notionPage = {
      parent: { database_id: targetDatabaseId },
      properties: {
        "Title": {
          title: [
            {
              text: {
                content: `Interview Summary - ${new Date().toLocaleDateString()}`
              }
            }
          ]
        },
        "Rating": {
          number: summary.rating
        },
        "Summary": {
          rich_text: [
            {
              text: {
                content: summary.candidateSummary
              }
            }
          ]
        },
        "Skills": {
          rich_text: [
            {
              text: {
                content: summary.keySkills.join(', ')
              }
            }
          ]
        },
        "Concerns": {
          rich_text: [
            {
              text: {
                content: summary.redFlags.join(', ')
              }
            }
          ]
        },
        "Actions": {
          rich_text: [
            {
              text: {
                content: summary.suggestedActions.join(', ')
              }
            }
          ]
        }
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Full Transcript" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: transcript } }]
          }
        }
      ]
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(notionPage),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create Notion page')
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, pageId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Notion export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
