import {
  FilterState,
  saveFilters,
  loadFilters,
  getDefaultFilters,
  clearFilters,
} from '@/utils/filterStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console.error to avoid noise in tests
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('filterStorage utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getDefaultFilters', () => {
    it('returns correct default filter state', () => {
      const defaultFilters = getDefaultFilters();

      expect(defaultFilters).toEqual({
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
      });
    });
  });

  describe('saveFilters', () => {
    it('saves filters to localStorage with date conversion', () => {
      const testDate1 = new Date('2024-01-01T10:00:00Z');
      const testDate2 = new Date('2024-01-31T23:59:59Z');
      
      const filters: FilterState = {
        skills: ['React', 'TypeScript'],
        redFlags: ['Security Issue'],
        actions: ['Review Code'],
        searchQuery: 'test query',
        sortField: 'created_at',
        sortOrder: 'asc',
        dateRange: {
          from: testDate1,
          to: testDate2,
        },
      };

      saveFilters(filters);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'summary_filters',
        JSON.stringify({
          skills: ['React', 'TypeScript'],
          redFlags: ['Security Issue'],
          actions: ['Review Code'],
          searchQuery: 'test query',
          sortField: 'created_at',
          sortOrder: 'asc',
          dateRange: {
            from: testDate1.toISOString(),
            to: testDate2.toISOString(),
          },
        })
      );
    });

    it('handles null dates correctly', () => {
      const filters: FilterState = {
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

      saveFilters(filters);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'summary_filters',
        JSON.stringify({
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
        })
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const filters = getDefaultFilters();
      
      // Should not throw
      expect(() => saveFilters(filters)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving filters:',
        expect.any(Error)
      );
    });
  });

  describe('loadFilters', () => {
    it('loads and parses filters from localStorage', () => {
      const storedFilters = {
        skills: ['JavaScript'],
        redFlags: ['Performance'],
        actions: ['Optimize'],
        searchQuery: 'performance',
        sortField: 'title',
        sortOrder: 'asc',
        dateRange: {
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-31T23:59:59.999Z',
        },
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedFilters));

      const loadedFilters = loadFilters();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('summary_filters');
      expect(loadedFilters).toEqual({
        skills: ['JavaScript'],
        redFlags: ['Performance'],
        actions: ['Optimize'],
        searchQuery: 'performance',
        sortField: 'title',
        sortOrder: 'asc',
        dateRange: {
          from: new Date('2024-01-01T00:00:00.000Z'),
          to: new Date('2024-01-31T23:59:59.999Z'),
        },
      });
    });

    it('returns default filters when no stored data exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const loadedFilters = loadFilters();

      expect(loadedFilters).toEqual(getDefaultFilters());
    });

    it('handles null dates in stored data', () => {
      const storedFilters = {
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

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedFilters));

      const loadedFilters = loadFilters();

      expect(loadedFilters.dateRange.from).toBeNull();
      expect(loadedFilters.dateRange.to).toBeNull();
    });

    it('returns default filters when JSON parsing fails', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const loadedFilters = loadFilters();

      expect(loadedFilters).toEqual(getDefaultFilters());
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading filters:',
        expect.any(Error)
      );
    });

    it('returns default filters when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available');
      });

      const loadedFilters = loadFilters();

      expect(loadedFilters).toEqual(getDefaultFilters());
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading filters:',
        expect.any(Error)
      );
    });
  });

  describe('clearFilters', () => {
    it('removes filters from localStorage', () => {
      clearFilters();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('summary_filters');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available');
      });

      // Should not throw
      expect(() => clearFilters()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error clearing filters:',
        expect.any(Error)
      );
    });
  });
});
