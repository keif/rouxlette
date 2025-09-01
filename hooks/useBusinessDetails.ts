import { useState, useEffect } from 'react';
import { getBusinessDetails } from '../api/yelp';
import { BusinessProps } from './useResults';
import { logSafe } from '../utils/log';

// In-memory cache for business details during the app session
const detailsCache = new Map<string, any>();

interface UseBusinessDetailsResult {
  business: BusinessProps;
  loading: boolean;
}

/**
 * Hook to enrich basic business data with detailed information from Yelp
 * Includes caching to avoid redundant API calls during the app session
 * 
 * @param basicBusiness - The basic business object from search results
 * @returns {business: enriched business, loading: boolean}
 */
export function useBusinessDetails(basicBusiness: BusinessProps): UseBusinessDetailsResult {
  const [mergedBusiness, setMergedBusiness] = useState<BusinessProps>(basicBusiness);
  const [loading, setLoading] = useState(false);

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
      return;
    }

    // Fetch details from API
    const fetchDetails = async () => {
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
        logSafe('[useBusinessDetails] Successfully enriched business details');
        
      } catch (error: any) {
        logSafe('[useBusinessDetails] Failed to fetch business details', { 
          id: basicBusiness.id, 
          error: error?.message 
        });
        // On error, keep the basic business data
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [basicBusiness?.id]);

  return {
    business: mergedBusiness,
    loading
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