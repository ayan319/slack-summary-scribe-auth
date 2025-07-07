/**
 * Filter Storage Utilities
 * Manages localStorage persistence for summary filters
 */

export interface FilterState {
  skills: string[];
  redFlags: string[];
  actions: string[];
  searchQuery: string;
  sortField: 'timestamp' | 'created_at' | 'title';
  sortOrder: 'asc' | 'desc';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

const STORAGE_KEY = 'summary_filters';

export function getDefaultFilters(): FilterState {
  return {
    skills: [],
    redFlags: [],
    actions: [],
    searchQuery: '',
    sortField: 'timestamp',
    sortOrder: 'desc',
    dateRange: {
      from: null,
      to: null,
    },
  };
}

export function saveFilters(filters: FilterState): void {
  try {
    const serializable = {
      ...filters,
      dateRange: {
        from: filters.dateRange.from?.toISOString() || null,
        to: filters.dateRange.to?.toISOString() || null,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Error saving filters:', error);
  }
}

export function loadFilters(): FilterState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultFilters();
    }

    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      dateRange: {
        from: parsed.dateRange.from ? new Date(parsed.dateRange.from) : null,
        to: parsed.dateRange.to ? new Date(parsed.dateRange.to) : null,
      },
    };
  } catch (error) {
    console.error('Error loading filters:', error);
    return getDefaultFilters();
  }
}

export function clearFilters(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing filters:', error);
  }
}
