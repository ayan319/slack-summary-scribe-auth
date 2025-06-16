
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { SummaryData, HistoryItem } from "@/types/summary";

// For localStorage fallback
const LOCAL_KEY = "summaryHistory";
const HISTORY_LIMIT = 10;

export function useUserSummaries(session: Session | null) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper: Load summaries from Supabase
  const loadFromSupabase = useCallback(async (user_id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("summaries")
      .select("id, transcript, summary, timestamp, title")
      .eq("user_id", user_id)
      .order("timestamp", { ascending: false })
      .limit(HISTORY_LIMIT);
    setLoading(false);

    if (error) {
      // Fallback to local data if error (e.g. RLS, expired session)
      const local = localStorage.getItem(LOCAL_KEY);
      setHistory(local ? JSON.parse(local).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })) : []);
      return;
    }

    if (data) {
      const hydrated: HistoryItem[] = data.map((item: any) => ({
        id: item.id,
        timestamp: new Date(item.timestamp),
        transcript: item.transcript,
        summary: item.summary as SummaryData,
        title: item.title ?? `Interview Summary - ${new Date(item.timestamp).toLocaleDateString()}`,
        userRating: item.summary?.userRating,
        tags: item.summary?.tags || []
      }));
      setHistory(hydrated);
    }
  }, []);

  // Helper: Load from localStorage
  const loadFromLocal = useCallback(() => {
    const local = localStorage.getItem(LOCAL_KEY);
    setHistory(local ? JSON.parse(local).map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })) : []);
  }, []);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      loadFromSupabase(session.user.id);
    } else {
      loadFromLocal();
    }
  }, [session, loadFromSupabase, loadFromLocal]);

  // Add new summary
  const addHistory = async (entry: Omit<HistoryItem, "id">) => {
    if (session?.user) {
      // Store in Supabase
      const { data, error } = await supabase
        .from("summaries")
        .insert({
          user_id: session.user.id,
          transcript: entry.transcript,
          summary: entry.summary as any,
          timestamp: entry.timestamp.toISOString(),
          title: entry.title
        })
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        const newItem: HistoryItem = {
          id: data[0].id,
          ...entry,
        };
        setHistory(h => [newItem, ...h].slice(0, HISTORY_LIMIT));
      }
    } else {
      // Local only
      const local = localStorage.getItem(LOCAL_KEY);
      let prev = local ? JSON.parse(local) : [];
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        ...entry,
      };
      // Limit
      prev = [newItem, ...prev].slice(0, HISTORY_LIMIT);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(prev));
      setHistory(prev.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  };

  // Update existing summary
  const updateHistory = async (updatedItem: HistoryItem) => {
    if (session?.user) {
      const { error } = await supabase
        .from("summaries")
        .update({
          summary: updatedItem.summary as any,
          title: updatedItem.title
        })
        .eq("id", updatedItem.id);
      if (error) throw error;
      
      setHistory(h => h.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
    } else {
      // Update localStorage
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        const data = JSON.parse(local);
        const updatedData = data.map((item: any) => 
          item.id === updatedItem.id ? updatedItem : item
        );
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedData));
        setHistory(updatedData.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    }
  };

  // Clear all summaries
  const clearHistory = async () => {
    if (session?.user) {
      const ids = history.map(h => h.id);
      if (ids.length > 0) {
        const { error } = await supabase
          .from("summaries")
          .delete()
          .in("id", ids);
        if (error) throw error;
      }
      setHistory([]);
    } else {
      localStorage.removeItem(LOCAL_KEY);
      setHistory([]);
    }
  };

  // API
  return {
    history,
    setHistory,
    addHistory,
    updateHistory,
    clearHistory,
    loading,
    reload: () => {
      if (session?.user) loadFromSupabase(session.user.id);
      else loadFromLocal();
    }
  };
}
