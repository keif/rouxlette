/**
 * Enhanced filters persistence hook with feedback loop prevention
 * 
 * This version prevents the "Excessive number of pending callbacks" error
 * by implementing proper hydration guards, change detection, and debounced writes.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Filters, initialFilters } from '../context/stateRefactored';
import { logSafe, safeStringify } from '../utils/log';

const FILTERS_STORAGE_KEY = '@roux:filters';
const DEBOUNCE_DELAY_MS = 250;

/**
 * Hook return interface
 */
export interface UsePersistFiltersReturn {
  /** Whether filters have been loaded from storage */
  isHydrated: boolean;
  /** Force save current filters (bypasses debounce) */
  forceSave: (filters: Filters) => Promise<void>;
  /** Clear stored filters */
  clearStored: () => Promise<void>;
  /** Get debug info about persistence state */
  getDebugInfo: () => {
    isHydrated: boolean;
    lastSaved: Filters | null;
    hasPendingWrite: boolean;
  };
}

/**
 * Deep equality check for filters
 */
function filtersEqual(a: Filters, b: Filters): boolean {
  return (
    safeStringify(a.categoryIds.sort()) === safeStringify(b.categoryIds.sort()) &&
    safeStringify(a.priceLevels.sort()) === safeStringify(b.priceLevels.sort()) &&
    a.openNow === b.openNow &&
    a.radiusMeters === b.radiusMeters &&
    a.minRating === b.minRating
  );
}

/**
 * Enhanced filters persistence hook
 * 
 * @param currentFilters - Current filters from Context state
 * @param onHydrated - Callback when filters are loaded from storage
 * @returns Persistence utilities and status
 */
export function usePersistFilters(
  currentFilters: Filters,
  onHydrated?: (filters: Filters) => void
): UsePersistFiltersReturn {
  // Hydration and state tracking
  const [isHydrated, setIsHydrated] = useState(false);
  const lastSavedRef = useRef<Filters | null>(null);
  const pendingWriteRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialRenderRef = useRef(true);
  
  /**
   * Load filters from storage (called once on mount)
   */
  const hydrateFilters = useCallback(async () => {
    try {
      logSafe('usePersistFilters:hydrating', 'Loading filters from storage...');
      
      const storedJson = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
      
      if (storedJson) {
        const storedFilters: Filters = JSON.parse(storedJson);
        
        // Merge with defaults to handle schema evolution
        const mergedFilters: Filters = {
          ...initialFilters,
          ...storedFilters,
        };
        
        lastSavedRef.current = mergedFilters;
        setIsHydrated(true);
        
        logSafe('usePersistFilters:hydrated', {
          categoryIds: mergedFilters.categoryIds.length,
          priceLevels: mergedFilters.priceLevels,
          openNow: mergedFilters.openNow,
          radiusMeters: mergedFilters.radiusMeters,
          minRating: mergedFilters.minRating
        });
        
        onHydrated?.(mergedFilters);
      } else {
        // No stored filters, use defaults
        lastSavedRef.current = initialFilters;
        setIsHydrated(true);
        
        logSafe('usePersistFilters:hydrated', 'No stored filters, using defaults');
        onHydrated?.(initialFilters);
      }
    } catch (error: any) {
      logSafe('[usePersistFilters] Hydration failed', { message: error?.message });
      
      // Set hydrated anyway to prevent infinite loops
      lastSavedRef.current = initialFilters;
      setIsHydrated(true);
      onHydrated?.(initialFilters);
    }
  }, [onHydrated]);
  
  /**
   * Save filters to storage (debounced)
   */
  const saveFilters = useCallback(async (filters: Filters) => {
    try {
      const filtersJson = safeStringify(filters);
      await AsyncStorage.setItem(FILTERS_STORAGE_KEY, filtersJson);
      
      lastSavedRef.current = filters;
      
      logSafe('usePersistFilters:saved', {
        categoryIds: filters.categoryIds.length,
        priceLevels: filters.priceLevels,
        openNow: filters.openNow,
        radiusMeters: filters.radiusMeters,
        minRating: filters.minRating
      });
    } catch (error: any) {
      logSafe('[usePersistFilters] Save failed', { message: error?.message });
    }
  }, []);
  
  /**
   * Debounced save function
   */
  const debouncedSave = useCallback((filters: Filters) => {
    // Clear any pending write
    if (pendingWriteRef.current) {
      clearTimeout(pendingWriteRef.current);
    }
    
    // Schedule new write
    pendingWriteRef.current = setTimeout(() => {
      saveFilters(filters);
      pendingWriteRef.current = null;
    }, DEBOUNCE_DELAY_MS);
  }, [saveFilters]);
  
  /**
   * Force immediate save (bypasses debounce)
   */
  const forceSave = useCallback(async (filters: Filters) => {
    // Clear any pending debounced save
    if (pendingWriteRef.current) {
      clearTimeout(pendingWriteRef.current);
      pendingWriteRef.current = null;
    }
    
    await saveFilters(filters);
  }, [saveFilters]);
  
  /**
   * Clear stored filters
   */
  const clearStored = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FILTERS_STORAGE_KEY);
      lastSavedRef.current = null;
      
      logSafe('usePersistFilters:cleared', 'Removed stored filters');
    } catch (error: any) {
      logSafe('[usePersistFilters] Clear failed', { message: error?.message });
    }
  }, []);
  
  /**
   * Get debug info
   */
  const getDebugInfo = useCallback(() => ({
    isHydrated,
    lastSaved: lastSavedRef.current,
    hasPendingWrite: pendingWriteRef.current !== null
  }), [isHydrated]);
  
  // Hydrate once on mount
  useEffect(() => {
    hydrateFilters();
  }, [hydrateFilters]);
  
  // Save filters when they change (but only after hydration)
  useEffect(() => {
    // Skip on initial render
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }
    
    // Only save if hydrated
    if (!isHydrated) {
      return;
    }
    
    // Only save if filters actually changed
    if (lastSavedRef.current && filtersEqual(currentFilters, lastSavedRef.current)) {
      return;
    }
    
    logSafe('usePersistFilters:change-detected', 'Scheduling save for changed filters');
    debouncedSave(currentFilters);
  }, [currentFilters, isHydrated, debouncedSave]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingWriteRef.current) {
        clearTimeout(pendingWriteRef.current);
      }
    };
  }, []);
  
  return {
    isHydrated,
    forceSave,
    clearStored,
    getDebugInfo,
  };
}

/**
 * Generic persistence hook for other data types
 */
export function usePersistData<T>(
  storageKey: string,
  currentData: T,
  defaultData: T,
  onHydrated?: (data: T) => void,
  debounceMs: number = DEBOUNCE_DELAY_MS,
  equalityFn?: (a: T, b: T) => boolean
) {
  const [isHydrated, setIsHydrated] = useState(false);
  const lastSavedRef = useRef<T | null>(null);
  const pendingWriteRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialRenderRef = useRef(true);
  
  const isEqual = equalityFn || ((a: T, b: T) => safeStringify(a) === safeStringify(b));
  
  const hydrateData = useCallback(async () => {
    try {
      logSafe(`usePersistData:${storageKey}:hydrating`, 'Loading from storage...');
      
      const storedJson = await AsyncStorage.getItem(`@roux:${storageKey}`);
      
      if (storedJson) {
        const storedData: T = JSON.parse(storedJson);
        lastSavedRef.current = storedData;
        setIsHydrated(true);
        
        logSafe(`usePersistData:${storageKey}:hydrated`, 'Loaded from storage');
        onHydrated?.(storedData);
      } else {
        lastSavedRef.current = defaultData;
        setIsHydrated(true);
        
        logSafe(`usePersistData:${storageKey}:hydrated`, 'Using defaults');
        onHydrated?.(defaultData);
      }
    } catch (error: any) {
      logSafe(`[usePersistData:${storageKey}] Hydration failed`, { message: error?.message });
      
      lastSavedRef.current = defaultData;
      setIsHydrated(true);
      onHydrated?.(defaultData);
    }
  }, [storageKey, defaultData, onHydrated]);
  
  const saveData = useCallback(async (data: T) => {
    try {
      const dataJson = safeStringify(data);
      await AsyncStorage.setItem(`@roux:${storageKey}`, dataJson);
      
      lastSavedRef.current = data;
      logSafe(`usePersistData:${storageKey}:saved`, 'Data saved to storage');
    } catch (error: any) {
      logSafe(`[usePersistData:${storageKey}] Save failed`, { message: error?.message });
    }
  }, [storageKey]);
  
  const debouncedSave = useCallback((data: T) => {
    if (pendingWriteRef.current) {
      clearTimeout(pendingWriteRef.current);
    }
    
    pendingWriteRef.current = setTimeout(() => {
      saveData(data);
      pendingWriteRef.current = null;
    }, debounceMs);
  }, [saveData, debounceMs]);
  
  // Hydrate once on mount
  useEffect(() => {
    hydrateData();
  }, [hydrateData]);
  
  // Save data when it changes
  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }
    
    if (!isHydrated) return;
    
    if (lastSavedRef.current && isEqual(currentData, lastSavedRef.current)) {
      return;
    }
    
    debouncedSave(currentData);
  }, [currentData, isHydrated, debouncedSave, isEqual]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (pendingWriteRef.current) {
        clearTimeout(pendingWriteRef.current);
      }
    };
  }, []);
  
  return {
    isHydrated,
    forceSave: (data: T) => saveData(data),
    clear: () => AsyncStorage.removeItem(`@roux:${storageKey}`),
  };
}