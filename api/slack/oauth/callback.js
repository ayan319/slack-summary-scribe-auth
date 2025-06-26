export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code from Slack");
  }

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      redirect_uri:
        "https://your-vercel-url.vercel.app/api/slack/oauth/callback",
    }),
  });

  const data = await response.json();
  console.log("Slack OAuth response:", data);

  if (!data.ok) {
    return res.status(500).json({ error: data.error });
  }

  // Store tokens to Supabase if needed (data.access_token, data.team.id, etc.)

  res.redirect("/auth/success");
}
