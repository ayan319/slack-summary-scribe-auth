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
    const { summary, transcript, crmType } = await req.json();

    let result;

    switch (crmType) {
      case "salesforce":
        result = await exportToSalesforce(summary, transcript);
        break;
      case "hubspot":
        result = await exportToHubspot(summary, transcript);
        break;
      case "pipedrive":
        result = await exportToPipedrive(summary, transcript);
        break;
      default:
        // Mock export for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = { success: true, id: "mock-" + Date.now() };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CRM export error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function exportToSalesforce(summary: any, transcript: string) {
  const sfToken = Deno.env.get("SALESFORCE_ACCESS_TOKEN");
  const sfInstanceUrl = Deno.env.get("SALESFORCE_INSTANCE_URL");

  if (!sfToken || !sfInstanceUrl) {
    throw new Error("Salesforce credentials not configured");
  }

  // Create a Contact record
  const contactData = {
    LastName: `Interview Candidate - ${new Date().toLocaleDateString()}`,
    Description: summary.candidateSummary,
    Rating_Score__c: summary.rating,
    Key_Skills__c: summary.keySkills.join(", "),
    Red_Flags__c: summary.redFlags.join(", "),
    Interview_Transcript__c: transcript,
  };

  const response = await fetch(
    `${sfInstanceUrl}/services/data/v58.0/sobjects/Contact/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create Salesforce contact");
  }

  return await response.json();
}

async function exportToHubspot(summary: any, transcript: string) {
  const hubspotToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN");

  if (!hubspotToken) {
    throw new Error("HubSpot credentials not configured");
  }

  const contactData = {
    properties: {
      lastname: `Interview Candidate - ${new Date().toLocaleDateString()}`,
      notes_last_contacted: summary.candidateSummary,
      rating: summary.rating.toString(),
      skills: summary.keySkills.join(", "),
      red_flags: summary.redFlags.join(", "),
    },
  };

  const response = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hubspotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create HubSpot contact");
  }

  return await response.json();
}

async function exportToPipedrive(summary: any, transcript: string) {
  const pipedriveToken = Deno.env.get("PIPEDRIVE_API_TOKEN");

  if (!pipedriveToken) {
    throw new Error("Pipedrive credentials not configured");
  }

  const personData = {
    name: `Interview Candidate - ${new Date().toLocaleDateString()}`,
    notes: summary.candidateSummary,
    custom_fields: {
      rating: summary.rating,
      skills: summary.keySkills.join(", "),
      red_flags: summary.redFlags.join(", "),
    },
  };

  const response = await fetch(
    `https://api.pipedrive.com/v1/persons?api_token=${pipedriveToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(personData),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create Pipedrive person");
  }

  return await response.json();
}
