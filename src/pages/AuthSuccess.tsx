import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teamName = searchParams.get("team");
  const code = searchParams.get("code");

  useEffect(() => {
    async function handleAuth() {
      if (!code) {
        setError("No authorization code received from Slack");
        setIsLoading(false);
        return;
      }

      try {
        // Exchange code for tokens
        const response = await fetch("/api/slack/oauth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for tokens");
        }

        const {
          access_token,
          team_id,
          team_name,
          user_id,
          bot_user_id,
          app_id,
        } = await response.json();

        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user found");
        }

        // Store tokens in Supabase
        const { error: dbError } = await supabase.from("slack_tokens").upsert({
          team_id,
          team_name,
          user_id: session.user.id,
          access_token,
          bot_user_id,
          app_id,
          scope:
            "chat:write,channels:history,groups:history,im:history,mpim:history",
          token_type: "bot",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (dbError) {
          throw new Error("Failed to store Slack tokens");
        }

        // Success - redirect to dashboard
        toast({
          title: "Successfully connected to Slack",
          description: `Connected to ${team_name || "your workspace"}`,
        });
        navigate("/dashboard");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
        toast({
          title: "Error connecting to Slack",
          description:
            err instanceof Error ? err.message : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    handleAuth();
  }, [code, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Slack...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md border">
          <AlertCircle className="mx-auto h-20 w-20 text-red-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Connection Failed
          </h1>
          <p className="text-red-600 mb-8">{error}</p>
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md border">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          🎉 Successfully Connected!
        </h1>
        <p className="text-gray-600 mb-2">
          {teamName
            ? `Connected to ${teamName}`
            : "Your Slack workspace has been connected"}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          You can now access all the features of Slack Summarizer.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate("/slack-test")}
            variant="outline"
            className="w-full"
          >
            Test Slack Integration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
