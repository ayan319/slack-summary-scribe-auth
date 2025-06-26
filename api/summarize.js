export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { transcript } = req.body || {};
  if (!transcript) {
    return res.status(400).json({ error: "Missing transcript" });
  }

  const prompt = `You are an AI recruitment assistant.\nBased on the following transcript, generate a structured summary with:\n\nCandidate Summary (2–3 lines)\n\nKey Skills Mentioned (list)\n\nRed Flags (if any)\n\nSuggested Action Items\n\nRating (1–5) with Reason\n\nTranscript:\n${transcript}`;

  try {
    const response = await fetch(process.env.OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.REFERER,
        "X-Title": process.env.APP_NAME,
      },
      body: JSON.stringify({
        model: process.env.MODEL_ID,
        messages: [{ role: "system", content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res
        .status(500)
        .json({ error: data.error || "Failed to summarize transcript" });
    }
    // Return the summary as JSON
    return res
      .status(200)
      .json({ summary: data.choices?.[0]?.message?.content || data });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
}
