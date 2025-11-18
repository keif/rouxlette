import { useState, useEffect, useCallback } from 'react';
import { getBusinessDetails } from '../api/yelp';
import { BusinessProps } from './useResults';
import { logSafe } from '../utils/log';

// In-memory cache for business details during the app session
const detailsCache = new Map<string, any>();

interface UseBusinessDetailsResult {
  business: BusinessProps;
  loading: boolean;
  fetchDetails: () => Promise<void>;
  hasDetails: boolean;
}

/**
 * Hook to enrich basic business data with detailed information from Yelp
 * Supports both auto-fetch and lazy-loading modes
 * Includes caching to avoid redundant API calls during the app session
 *
 * @param basicBusiness - The basic business object from search results
 * @param autoFetch - If true, fetches details immediately on mount (default: false for lazy loading)
 * @returns {business: enriched business, loading: boolean, fetchDetails: function, hasDetails: boolean}
 */
export function useBusinessDetails(basicBusiness: BusinessProps, autoFetch = false): UseBusinessDetailsResult {
  const [mergedBusiness, setMergedBusiness] = useState<BusinessProps>(basicBusiness);
  const [loading, setLoading] = useState(false);
  const [hasDetails, setHasDetails] = useState(false);

  // Check cache on mount
  useEffect(() => {
    if (!basicBusiness?.id) {
      return;
    }

    // Always start with the basic business data
    setMergedBusiness(basicBusiness);

    // Check if we already have cached details
    const cached = detailsCache.get(basicBusiness.id);
    if (cached) {
      logSafe('[useBusinessDetails] Using cached details for', { id: basicBusiness.id, name: basicBusiness.name });
      setMergedBusiness({
        ...basicBusiness,
        ...cached,
        // Preserve essential search data
        id: basicBusiness.id,
        name: basicBusiness.name,
        coordinates: basicBusiness.coordinates,
        location: basicBusiness.location,
      });
      setHasDetails(true);
    }
  }, [basicBusiness?.id]);

  // Fetch function that can be called on-demand
  const fetchDetails = useCallback(async () => {
    if (!basicBusiness?.id) {
      return;
    }

    // Skip if already cached
    if (detailsCache.has(basicBusiness.id)) {
      logSafe('[useBusinessDetails] Already have cached details');
      return;
    }

    setLoading(true);
    try {
      logSafe('[useBusinessDetails] Fetching details for', { id: basicBusiness.id, name: basicBusiness.name });

      const detailsData = await getBusinessDetails(basicBusiness.id);

      // Cache the details
      detailsCache.set(basicBusiness.id, detailsData);

      // Merge with basic business data, preserving search-specific fields
      const enriched = {
        ...basicBusiness,
        ...detailsData,
        // Always preserve these fields from search results
        id: basicBusiness.id,
        name: basicBusiness.name,
        coordinates: basicBusiness.coordinates,
        location: basicBusiness.location,
      };

      setMergedBusiness(enriched);
      setHasDetails(true);
      logSafe('[useBusinessDetails] Successfully enriched business details', {
        photosCount: detailsData.photos?.length || 0,
        hasHours: !!detailsData.hours
      });

    } catch (error: any) {
      logSafe('[useBusinessDetails] Failed to fetch business details', {
        id: basicBusiness.id,
        error: error?.message
      });
      // On error, keep the basic business data
    } finally {
      setLoading(false);
    }
  }, [basicBusiness]);

  // Auto-fetch if requested
  useEffect(() => {
    if (autoFetch && basicBusiness?.id && !detailsCache.has(basicBusiness.id)) {
      fetchDetails();
    }
  }, [autoFetch, basicBusiness?.id, fetchDetails]);

  return {
    business: mergedBusiness,
    loading,
    fetchDetails,
    hasDetails
  };
}

/**
 * Clear the details cache (useful for testing or memory management)
 */
export function clearBusinessDetailsCache() {
  detailsCache.clear();
}

/**
 * Get cache size (for debugging)
 */
export function getBusinessDetailsCacheSize() {
  return detailsCache.size;
}