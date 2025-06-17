
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        if (event.type === 'message' && !event.bot_id) {
          const messageId = event.ts;
          const channelId = event.channel;
          const userId = event.user;
          const text = event.text;

          console.log('Processing message:', { messageId, channelId, userId, text });

          // Check if message contains summary request keywords
          const summaryKeywords = ['summary', 'summarize', 'analyze', 'review'];
          const shouldProcess = summaryKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
          );

          if (shouldProcess) {
            console.log('Message contains summary keywords, processing...');
            
            // For now, we'll respond with a simple acknowledgment
            // In a real implementation, you'd process the message and generate a summary
            const response = {
              processed: true,
              messageId,
              channelId,
              summary: {
                candidateSummary: `Summary for message ${messageId}`,
                keySkills: ['Communication', 'Problem Solving'],
                redFlags: [],
                suggestedActions: ['Follow up within 24 hours'],
                rating: 4
              }
            };

            return new Response(JSON.stringify(response), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
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
