import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { summary, transcript, channel } = await req.json();

    // Get Slack bot token from environment
    const slackToken = Deno.env.get("SLACK_BOT_TOKEN");

    if (!slackToken) {
      return new Response(
        JSON.stringify({ error: "Slack integration not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Format the summary for Slack
    const slackMessage = {
      channel: `#${channel}`,
      text: "Interview Summary",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 Interview Summary",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Summary:*\n${summary.candidateSummary}`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Rating:* ${"⭐".repeat(Math.floor(summary.rating))} (${summary.rating}/10)`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Key Skills:*\n${summary.keySkills.map((skill) => `• ${skill}`).join("\n")}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Concerns:*\n${summary.redFlags.map((flag) => `⚠️ ${flag}`).join("\n")}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Recommended Actions:*\n${summary.suggestedActions.map((action) => `✅ ${action}`).join("\n")}`,
          },
        },
      ],
    };

    // Send to Slack
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Failed to post to Slack");
    }

    return new Response(
      JSON.stringify({ success: true, messageTs: result.ts }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Slack export error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
