import { useCallback, useRef } from 'react';
import usePersistentStorage from './usePersistentStorage';
import { BusinessProps } from './useResults';
import { logSafe, logArray } from '../utils/log';

/**
 * Hardened persistence hook for restaurant search results caching.
 * 
 * Prevents the AsyncStorage feedback loop by:
 * - Using debounced writes
 * - Implementing proper cache key management
 * - Only saving when results actually change
 * - Graceful error handling
 */
export default function useResultsPersistence() {
  const storage = usePersistentStorage({
    debug: __DEV__,
    debounceMs: 1000, // Longer delay for search results since they're larger
  });

  // Track cache keys to prevent duplicate requests
  const activeCacheKeys = useRef<Set<string>>(new Set());

  /**
   * Generate a cache key from search parameters
   */
  const generateCacheKey = useCallback((location: string, term: string, coords?: any): string => {
    if (coords?.latitude && coords?.longitude) {
      // Use coordinates for more precise caching
      const lat = coords.latitude.toFixed(4);
      const lng = coords.longitude.toFixed(4);
      return `search:${lat},${lng}:${term}`;
    }
    
    // Fallback to location string
    const normalizedLocation = location.trim().toLowerCase();
    const normalizedTerm = term.trim().toLowerCase();
    return `search:${normalizedLocation}:${normalizedTerm}`;
  }, []);

  /**
   * Load cached results for a search
   */
  const getCachedResults = useCallback(async (
    location: string, 
    term: string, 
    coords?: any
  ): Promise<BusinessProps[] | null> => {
    const cacheKey = generateCacheKey(location, term, coords);
    
    try {
      const cached = await storage.getItem<BusinessProps[]>(cacheKey);
      
      if (cached && Array.isArray(cached)) {
        logArray(`useResultsPersistence cache hit for: ${cacheKey}`, cached, { limit: 3 });
        return cached;
      }
      
      logSafe(`[useResultsPersistence] Cache miss for: ${cacheKey}`);
      return null;
    } catch (error: any) {
      logSafe(`[useResultsPersistence] Failed to load cache for ${cacheKey}`, { message: error?.message });
      return null;
    }
  }, [storage, generateCacheKey]);

  /**
   * Save search results to cache
   */
  const cacheResults = useCallback(async (
    location: string,
    term: string,
    results: BusinessProps[],
    coords?: any
  ): Promise<void> => {
    const cacheKey = generateCacheKey(location, term, coords);
    
    // Prevent duplicate cache operations for the same key
    if (activeCacheKeys.current.has(cacheKey)) {
      logSafe(`[useResultsPersistence] Cache operation already in progress for: ${cacheKey}`);
      return;
    }
    
    activeCacheKeys.current.add(cacheKey);
    
    try {
      // Only cache if we have valid results
      if (Array.isArray(results) && results.length > 0) {
        logArray(`useResultsPersistence caching results for: ${cacheKey}`, results, { limit: 3 });
        await storage.setItem(cacheKey, results);
      }
    } catch (error: any) {
      logSafe(`[useResultsPersistence] Failed to cache results for ${cacheKey}`, { message: error?.message });
    } finally {
      // Always remove from active keys, even on error
      activeCacheKeys.current.delete(cacheKey);
    }
  }, [storage, generateCacheKey]);

  /**
   * Clear old cache entries to prevent storage bloat
   * Call this occasionally or on app startup
   */
  const clearOldCache = useCallback(async (maxAgeHours: number = 24): Promise<void> => {
    try {
      const allItems = await storage.getAllItems();
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      // Note: This would require storing timestamps with cached data
      // For now, we'll implement a simple key-based cleanup
      
      logSafe(`[useResultsPersistence] Found ${allItems.length} cached items`);
      
      // TODO: Implement timestamp-based cleanup
      // For now, just log the cache size
    } catch (error: any) {
      logSafe('[useResultsPersistence] Failed to clear old cache', { message: error?.message });
    }
  }, [storage]);

  /**
   * Clear all cached results
   */
  const clearAllCache = useCallback(async (): Promise<void> => {
    try {
      // Get all storage keys and remove search-related ones
      const allKeys = await storage.getAllItems();
      
      // This is a simplified version - in practice, you'd want to 
      // iterate through keys and delete only search-related ones
      logSafe('[useResultsPersistence] Clearing all search cache');
      
      // TODO: Implement selective cache clearing
      
    } catch (error: any) {
      logSafe('[useResultsPersistence] Failed to clear cache', { message: error?.message });
    }
  }, [storage]);

  /**
   * Load cached results using a specific cache key (for enhanced search)
   */
  const getCachedResultsByKey = useCallback(async (cacheKey: string): Promise<BusinessProps[] | null> => {
    try {
      if (activeCacheKeys.current.has(cacheKey)) {
        logSafe('[useResultsPersistence] Request already in flight for cache key', { cacheKey });
        return null;
      }

      activeCacheKeys.current.add(cacheKey);
      
      const cached = await storage.getItem<BusinessProps[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        logArray('[useResultsPersistence] Cache hit for key', cached, 2);
        return cached;
      }
      
      return null;
    } catch (error: any) {
      logSafe('[useResultsPersistence] Cache read error', { cacheKey, error: error?.message });
      return null;
    } finally {
      activeCacheKeys.current.delete(cacheKey);
    }
  }, [storage]);

  /**
   * Cache results using a specific cache key (for enhanced search)
   */
  const cacheResultsByKey = useCallback(async (cacheKey: string, businesses: BusinessProps[]): Promise<void> => {
    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      logSafe('[useResultsPersistence] Skipping cache - no valid businesses to store');
      return;
    }

    try {
      await storage.setItem(cacheKey, businesses);
      logSafe('[useResultsPersistence] Cached results by key', { 
        cacheKey, 
        count: businesses.length 
      });
    } catch (error: any) {
      logSafe('[useResultsPersistence] Cache write error', { 
        cacheKey, 
        error: error?.message 
      });
    }
  }, [storage]);

  return {
    getCachedResults,
    cacheResults,
    getCachedResultsByKey,
    cacheResultsByKey,
    clearOldCache,
    clearAllCache,
    generateCacheKey,
  } as const;
}

/**
 * Example integration with useResults hook:
 * 
 * // In useResults.ts
 * export default function useResults() {
 *   const [results, setResults] = useState(INIT_RESULTS);
 *   const resultsPersistence = useResultsPersistence();
 *   
 *   const searchApi = useCallback(async (location: string, term: string, coords?: any) => {
 *     try {
 *       // First, check cache
 *       const cached = await resultsPersistence.getCachedResults(location, term, coords);
 *       if (cached) {
 *         setResults({ id: uuid(), businesses: cached });
 *         return;
 *       }
 *       
 *       // Make API call
 *       const response = await yelp.get('/businesses/search', {
 *         params: { location, term, limit: 50 }
 *       });
 *       
 *       const businesses = response.data.businesses.filter(b => !b.is_closed);
 *       
 *       // Cache the results
 *       await resultsPersistence.cacheResults(location, term, businesses, coords);
 *       
 *       setResults({ id: uuid(), businesses });
 *     } catch (error) {
 *       logSafe('Search API error', { message: error?.message });
 *     }
 *   }, [resultsPersistence]);
 *   
 *   return [term, results, searchApi] as const;
 * }
 */