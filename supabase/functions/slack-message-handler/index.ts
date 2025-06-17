
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Slack message handler called:', req.method);

  try {
    const body = await req.text();
    console.log('Received body:', body);

    // Handle Slack URL verification
    if (req.headers.get('content-type')?.includes('application/json')) {
      const data = JSON.parse(body);
      
      if (data.type === 'url_verification') {
        console.log('URL verification challenge:', data.challenge);
        return new Response(data.challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      // Handle Slack events
      if (data.type === 'event_callback') {
        const event = data.event;
        console.log('Received Slack event:', event);

        if (event.type === 'message' && !event.bot_id && event.text) {
          const messageId = event.ts;
          const channelId = event.channel;
          const userId = event.user;
          const text = event.text;

          console.log('Processing message:', { messageId, channelId, userId, text });

          // Check if message is substantial enough to process (more than 20 characters)
          if (text.length > 20) {
            console.log('Message is substantial, generating summary...');
            
            try {
              // Generate summary using OpenAI
              const summary = await generateSummary(text);
              
              // Save to Supabase
              await saveSummaryToDatabase(messageId, text, summary, userId);
              
              console.log('Summary generated and saved successfully');
              
              return new Response(JSON.stringify({
                processed: true,
                messageId,
                channelId,
                summary: summary
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
              
            } catch (error) {
              console.error('Error processing message:', error);
              return new Response(JSON.stringify({
                processed: false,
                error: error.message
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } else {
            console.log('Message too short, skipping processing');
          }
        }
      }
    }

    // Return OK for all other requests
    return new Response('OK', {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error in slack-message-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateSummary(text: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analyze the following Slack message and provide a structured summary in JSON format:

Message: "${text}"

Please provide a summary with the following structure:
{
  "candidateSummary": "Brief 2-3 sentence summary of the message content",
  "keySkills": ["skill1", "skill2", "skill3"],
  "redFlags": ["concern1", "concern2"] (if any),
  "suggestedActions": ["action1", "action2", "action3"],
  "rating": 4 (1-5 scale based on message quality/relevance)
}

Focus on extracting professional skills, concerns, and actionable insights from the message.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an AI assistant that analyzes messages and extracts professional insights. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response as JSON:', content);
    // Fallback summary if JSON parsing fails
    return {
      candidateSummary: `Message analysis: ${text.substring(0, 100)}...`,
      keySkills: ['Communication'],
      redFlags: [],
      suggestedActions: ['Review message content', 'Follow up if needed'],
      rating: 3
    };
  }
}

async function saveSummaryToDatabase(messageId: string, transcript: string, summary: any, slackUserId: string) {
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // For now, we'll use a system user ID since we don't have user mapping
  // In a real implementation, you'd map slack_user_id to your app's user_id
  const systemUserId = '00000000-0000-0000-0000-000000000000';

  const { data, error } = await supabase
    .from('summaries')
    .insert({
      user_id: systemUserId,
      message_id: messageId,
      transcript: transcript,
      summary: summary,
      title: `Slack Message Summary - ${new Date().toLocaleDateString()}`,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to save summary: ${error.message}`);
  }

  console.log('Summary saved to database:', data);
  return data;
}
