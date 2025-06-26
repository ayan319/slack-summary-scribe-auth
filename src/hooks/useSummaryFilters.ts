import { useMemo } from "react";
import { HistoryItem, FilterOptions } from "@/types/summary";

export const useSummaryFilters = (
  summaries: HistoryItem[],
  filters: FilterOptions,
) => {
  return useMemo(() => {
    let filtered = summaries;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.summary.candidateSummary.toLowerCase().includes(searchLower) ||
          item.title.toLowerCase().includes(searchLower) ||
          item.summary.keySkills.some((skill) =>
            skill.toLowerCase().includes(searchLower),
          ) ||
          item.summary.redFlags.some((flag) =>
            flag.toLowerCase().includes(searchLower),
          ) ||
          item.summary.suggestedActions.some((action) =>
            action.toLowerCase().includes(searchLower),
          ) ||
          item.transcript.toLowerCase().includes(searchLower),
      );
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((item) =>
        filters.tags.some(
          (filterTag) =>
            item.summary.tags?.includes(filterTag) ||
            item.tags?.includes(filterTag),
        ),
      );
    }

    // Rating filter
    if (filters.rating !== null) {
      filtered = filtered.filter((item) => {
        const rating =
          item.summary.userRating || item.userRating || item.summary.rating;
        return rating >= filters.rating!;
      });
    }

    return filtered;
  }, [summaries, filters]);
};
