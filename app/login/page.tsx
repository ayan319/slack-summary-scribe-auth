"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("signin"); // signin or signup

  // Using the singleton supabase client from lib/supabase

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let result;

      if (mode === "signup") {
        console.log("🔐 Attempting signup with:", email);
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`
          }
        });
      } else {
        console.log("🔐 Attempting signin with:", email);
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      const { data, error } = result;

      if (error) {
        console.error("❌ Auth error:", error);
        setError(error.message);
      } else if (data.session) {
        console.log("✅ Auth successful, redirecting to dashboard");
        window.location.href = "/dashboard";
      } else if (mode === "signup") {
        setError("Please check your email for verification link");
      }
    } catch (err) {
      console.error("❌ Auth exception:", err);
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting Google OAuth");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("❌ Google auth error:", error);
        setError(error.message);
      }
    } catch (err) {
      console.error("❌ Google auth exception:", err);
      setError("Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            🔑 {mode === "signin" ? "Sign In" : "Sign Up"}
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "⏳ Processing..." : (mode === "signin" ? "Sign In" : "Sign Up")}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "⏳ Processing..." : "🔗 Continue with Google"}
            </button>

            <div className="text-center">
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-blue-600 hover:text-blue-700 text-sm"
                disabled={loading}
              >
                {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                🔍 Test Dashboard (Debug)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
