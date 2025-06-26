import { useState } from "react";
import { toast } from "@/hooks/use-toast";

// Notion OAuth config (update with your integration IDs as secrets in Supabase)
const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID as string;
const REDIRECT_URI = window.location.origin + "/notion-oauth-callback";

export function useNotionOAuth() {
  const [token, setToken] = useState<string | null>(null);

  // Step 1: Start OAuth (open popup)
  const startOAuth = () => {
    const authUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${encodeURIComponent(NOTION_CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    window.open(authUrl, "_blank", "height=700,width=650");
  };

  // Step 2: Complete OAuth (called on callback page)
  const completeOAuth = async (code: string) => {
    // Call edge function to exchange code for token
    const res = await fetch(
      `/functions/v1/notion-oauth-callback?code=${encodeURIComponent(code)}`,
    );
    const data = await res.json();
    if (data.access_token) {
      setToken(data.access_token);
      localStorage.setItem("notion_access_token", data.access_token);
      return data.access_token;
    } else {
      toast({
        title: "Notion Authorization failed",
        variant: "destructive",
        description: data.error || "Unable to access Notion",
      });
    }
  };

  // Step 3: Use token (or get from localStorage)
  const getToken = () => token || localStorage.getItem("notion_access_token");

  return { startOAuth, completeOAuth, getToken };
}

// Fetch Notion databases (for the user to pick)
export async function fetchNotionDatabases(token: string) {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-02-22",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filter: { property: "object", value: "database" } }),
  });
  if (!res.ok) {
    throw new Error("Failed to list Notion databases");
  }
  const data = await res.json();
  return data.results || [];
}

export async function createNotionPage(
  token: string,
  databaseId: string,
  title: string,
  summaryData: any,
  transcript: string,
) {
  // Map summary fields into Notion page properties (assume database accepts simple text)
  const page = {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: title } }],
      },
      Summary: {
        rich_text: [{ text: { content: summaryData.candidateSummary } }],
      },
      "Key Skills": {
        rich_text: [{ text: { content: summaryData.keySkills.join(", ") } }],
      },
      "Red Flags": {
        rich_text: [{ text: { content: summaryData.redFlags.join(", ") } }],
      },
      "Suggested Actions": {
        rich_text: [
          { text: { content: summaryData.suggestedActions.join(", ") } },
        ],
      },
      Rating: {
        number: summaryData.rating,
      },
      Transcript: {
        rich_text: [{ text: { content: transcript } }],
      },
    },
  };
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-02-22",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(page),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Failed to create Notion page: " + err);
  }
  return await res.json();
}
