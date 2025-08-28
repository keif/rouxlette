/**
 * Results view hook that manages business data separately from Context
 * 
 * This hook provides a clean interface to business data while keeping
 * large objects out of the global Context to prevent PayloadTooLargeError.
 */

import { useRef, useCallback, useMemo } from 'react';
import { BusinessDataStore, createBusinessDataStore, ResultsMetadata } from '../context/stateRefactored';
import { YelpBusiness } from '../types/yelp';
import { logSafe, logArray } from '../utils/log';

export interface UseResultsViewReturn {
  // Data access
  getBusiness: (id: string) => YelpBusiness | null;
  getBusinesses: (ids: string[]) => YelpBusiness[];
  getAllBusinesses: () => YelpBusiness[];
  
  // Current results based on metadata from Context
  currentResults: YelpBusiness[];
  resultsCount: number;
  
  // Data management
  updateBusinesses: (businesses: YelpBusiness[], metadata?: ResultsMetadata) => void;
  clearBusinesses: () => void;
  
  // Utilities
  getBusinessesByCategory: (categoryAlias: string) => YelpBusiness[];
  getFavoriteBusinesses: (favoriteIds: string[]) => YelpBusiness[];
  getSpinHistoryBusinesses: (historyRefs: Array<{ businessId: string }>) => YelpBusiness[];
  
  // Debug info (safe for logging)
  getStoreInfo: () => { count: number; sampleIds: string[] };
}

/**
 * Hook for managing business data outside of Context
 * 
 * @param resultsMetadata - Results metadata from Context state
 * @returns Business data access interface
 */
export function useResultsView(resultsMetadata: ResultsMetadata | null): UseResultsViewReturn {
  // Business data store (persists across renders)
  const dataStoreRef = useRef<BusinessDataStore>();
  
  if (!dataStoreRef.current) {
    dataStoreRef.current = createBusinessDataStore();
  }
  
  const dataStore = dataStoreRef.current;
  
  // Memoized current results based on metadata
  const currentResults = useMemo(() => {
    if (!resultsMetadata || !resultsMetadata.businessIds.length) {
      return [];
    }
    
    const businesses = dataStore.getBusinesses(resultsMetadata.businessIds);
    
    // Log safe summary of results
    if (__DEV__ && businesses.length > 0) {
      logArray('useResultsView:currentResults', businesses, 2);
    }
    
    return businesses;
  }, [resultsMetadata, dataStore]);
  
  // Data access methods
  const getBusiness = useCallback((id: string) => {
    const business = dataStore.getBusiness(id);
    
    if (__DEV__ && business) {
      logSafe('useResultsView:getBusiness', {
        id: business.id,
        name: business.name,
        rating: business.rating,
        categories: business.categories?.map(c => c.title) || []
      });
    }
    
    return business;
  }, [dataStore]);
  
  const getBusinesses = useCallback((ids: string[]) => {
    const businesses = dataStore.getBusinesses(ids);
    
    if (__DEV__ && businesses.length > 0) {
      logArray('useResultsView:getBusinesses', businesses, 1);
    }
    
    return businesses;
  }, [dataStore]);
  
  const getAllBusinesses = useCallback(() => {
    const businesses = Array.from(dataStore.businesses.values());
    
    if (__DEV__) {
      logSafe('useResultsView:getAllBusinesses', `Count: ${businesses.length}`);
    }
    
    return businesses;
  }, [dataStore]);
  
  // Data management methods
  const updateBusinesses = useCallback((
    businesses: YelpBusiness[], 
    metadata?: ResultsMetadata
  ) => {
    dataStore.addBusinesses(businesses);
    
    if (__DEV__) {
      logSafe('useResultsView:updateBusinesses', {
        addedCount: businesses.length,
        totalCount: dataStore.getCount(),
        metadata: metadata ? {
          id: metadata.id,
          searchTerm: metadata.searchTerm,
          count: metadata.count
        } : undefined
      });
    }
  }, [dataStore]);
  
  const clearBusinesses = useCallback(() => {
    const oldCount = dataStore.getCount();
    dataStore.clear();
    
    if (__DEV__) {
      logSafe('useResultsView:clearBusinesses', `Cleared ${oldCount} businesses`);
    }
  }, [dataStore]);
  
  // Utility methods
  const getBusinessesByCategory = useCallback((categoryAlias: string) => {
    const allBusinesses = Array.from(dataStore.businesses.values());
    const filtered = allBusinesses.filter(business =>
      business.categories?.some(cat => cat.alias === categoryAlias)
    );
    
    if (__DEV__) {
      logSafe('useResultsView:getBusinessesByCategory', {
        categoryAlias,
        matchCount: filtered.length,
        totalCount: allBusinesses.length
      });
    }
    
    return filtered;
  }, [dataStore]);
  
  const getFavoriteBusinesses = useCallback((favoriteIds: string[]) => {
    return dataStore.getBusinesses(favoriteIds);
  }, [dataStore]);
  
  const getSpinHistoryBusinesses = useCallback((
    historyRefs: Array<{ businessId: string }>
  ) => {
    const ids = historyRefs.map(ref => ref.businessId);
    return dataStore.getBusinesses(ids);
  }, [dataStore]);
  
  const getStoreInfo = useCallback(() => {
    const allIds = Array.from(dataStore.businesses.keys());
    return {
      count: allIds.length,
      sampleIds: allIds.slice(0, 5)
    };
  }, [dataStore]);
  
  return {
    getBusiness,
    getBusinesses,
    getAllBusinesses,
    currentResults,
    resultsCount: currentResults.length,
    updateBusinesses,
    clearBusinesses,
    getBusinessesByCategory,
    getFavoriteBusinesses,
    getSpinHistoryBusinesses,
    getStoreInfo,
  };
}

/**
 * Hook for managing selected business (modal/detail view)
 * 
 * @param selectedBusinessId - ID from Context state
 * @param dataStore - Business data store
 * @returns Selected business data and management
 */
export function useSelectedBusiness(
  selectedBusinessId: string | null,
  getBusiness: (id: string) => YelpBusiness | null
) {
  const selectedBusiness = useMemo(() => {
    if (!selectedBusinessId) return null;
    return getBusiness(selectedBusinessId);
  }, [selectedBusinessId, getBusiness]);
  
  // Safe logging of selection changes
  const prevSelectedId = useRef<string | null>(null);
  
  if (__DEV__ && prevSelectedId.current !== selectedBusinessId) {
    logSafe('useSelectedBusiness:selectionChanged', {
      from: prevSelectedId.current,
      to: selectedBusinessId,
      businessName: selectedBusiness?.name || null
    });
    prevSelectedId.current = selectedBusinessId;
  }
  
  return {
    selectedBusiness,
    isSelected: !!selectedBusiness,
    businessId: selectedBusinessId
  };
}

/**
 * Hook for caching and retrieving search results
 * Integrates with existing useResults but manages data separately
 */
export function useResultsCache() {
  const cacheRef = useRef<Map<string, YelpBusiness[]>>(new Map());
  
  const getCachedResults = useCallback((cacheKey: string) => {
    const cached = cacheRef.current.get(cacheKey);
    
    if (__DEV__ && cached) {
      logSafe('useResultsCache:hit', {
        cacheKey,
        resultCount: cached.length
      });
    }
    
    return cached || null;
  }, []);
  
  const setCachedResults = useCallback((cacheKey: string, results: YelpBusiness[]) => {
    cacheRef.current.set(cacheKey, results);
    
    if (__DEV__) {
      logSafe('useResultsCache:set', {
        cacheKey,
        resultCount: results.length,
        totalCachedKeys: cacheRef.current.size
      });
    }
  }, []);
  
  const clearCache = useCallback(() => {
    const oldSize = cacheRef.current.size;
    cacheRef.current.clear();
    
    if (__DEV__) {
      logSafe('useResultsCache:clear', `Cleared ${oldSize} cached results`);
    }
  }, []);
  
  return {
    getCachedResults,
    setCachedResults,
    clearCache,
    getCacheInfo: () => ({
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys()).slice(0, 5)
    })
  };
}