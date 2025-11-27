import { useRef, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logSafe, safeStringify } from '../utils/log';

// Debounce utility for batching writes
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Deep comparison utility to detect actual changes
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

export interface PersistentStorageOptions {
  /** Storage key prefix (defaults to '@roux') */
  keyPrefix?: string;
  /** Debounce delay in ms (defaults to 300) */
  debounceMs?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Enhanced AsyncStorage hook with:
 * - Hydration tracking to prevent feedback loops
 * - Debounced writes to avoid flooding the bridge
 * - Deep comparison to skip unnecessary saves
 * - Proper error handling and logging
 */
export default function usePersistentStorage(options: PersistentStorageOptions = {}) {
  const {
    keyPrefix = '@roux',
    debounceMs = 300,
    debug = __DEV__
  } = options;

  // Track hydration status and last saved values to prevent loops
  const hydratedKeysRef = useRef<Set<string>>(new Set());
  const lastSavedRef = useRef<Map<string, any>>(new Map());
  const pendingWritesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      logSafe(`[usePersistentStorage] ${message}`, ...args);
    }
  }, [debug]);

  const handleError = useCallback((operation: string, key: string, error: any) => {
    logSafe(`[usePersistentStorage] ${operation} failed for key "${key}"`, { message: error?.message });
  }, []);

  // Enhanced getItem with hydration tracking
  const getItem = useCallback(async <T = any>(key: string): Promise<T | null> => {
    const storageKey = `${keyPrefix}:${key}`;
    
    try {
      log(`Loading key: ${key}`);
      const json = await AsyncStorage.getItem(storageKey);
      
      if (json === null) {
        log(`Key not found: ${key}`);
        hydratedKeysRef.current.add(key); // Mark as hydrated even if empty
        return null;
      }
      
      const data = JSON.parse(json);
      
      // Track this value as the last known saved state
      lastSavedRef.current.set(key, data);
      hydratedKeysRef.current.add(key);
      
      log(`Loaded key: ${key}`, data);
      return data;
    } catch (error) {
      handleError('getItem', key, error);
      hydratedKeysRef.current.add(key); // Mark as hydrated to prevent loops
      return null;
    }
  }, [keyPrefix, log, handleError]);

  // Debounced setItem with change detection
  const debouncedSetItem = useCallback(
    debounce(async (key: string, value: any) => {
      const storageKey = `${keyPrefix}:${key}`;
      
      try {
        const serializedValue = safeStringify(value);
        await AsyncStorage.setItem(storageKey, serializedValue);
        
        // Update our tracking
        lastSavedRef.current.set(key, value);
        log(`Saved key: ${key}`, value);
      } catch (error) {
        handleError('setItem', key, error);
      } finally {
        // Clear pending write
        pendingWritesRef.current.delete(key);
      }
    }, debounceMs),
    [keyPrefix, debounceMs, log, handleError]
  );

  const setItem = useCallback(async (key: string, value: any): Promise<void> => {
    // Skip if not hydrated yet (prevents overwriting on initial render)
    if (!hydratedKeysRef.current.has(key)) {
      log(`Skipping save for non-hydrated key: ${key}`);
      return;
    }

    // Skip if value hasn't actually changed
    const lastSaved = lastSavedRef.current.get(key);
    if (deepEqual(lastSaved, value)) {
      log(`Skipping save for unchanged key: ${key}`);
      return;
    }

    log(`Scheduling save for key: ${key}`, value);
    
    // Cancel any pending write for this key
    const existingTimeout = pendingWritesRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule the debounced write
    const timeout = setTimeout(() => debouncedSetItem(key, value), debounceMs);
    pendingWritesRef.current.set(key, timeout);
  }, [debouncedSetItem, debounceMs, log]);

  const deleteItem = useCallback(async (key: string): Promise<void> => {
    const storageKey = `${keyPrefix}:${key}`;
    
    try {
      // Cancel any pending writes
      const pendingWrite = pendingWritesRef.current.get(key);
      if (pendingWrite) {
        clearTimeout(pendingWrite);
        pendingWritesRef.current.delete(key);
      }

      await AsyncStorage.removeItem(storageKey);
      
      // Clean up tracking
      lastSavedRef.current.delete(key);
      hydratedKeysRef.current.delete(key);
      
      log(`Deleted key: ${key}`);
    } catch (error) {
      handleError('deleteItem', key, error);
    }
  }, [keyPrefix, log, handleError]);

  const getAllItems = useCallback(async (): Promise<any[]> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const rouxKeys = allKeys.filter(k => k.startsWith(`${keyPrefix}:`));
      
      if (rouxKeys.length === 0) {
        return [];
      }

      const results = await AsyncStorage.multiGet(rouxKeys);
      
      return results
        .map(([key, json]) => {
          if (json) {
            try {
              return JSON.parse(json);
            } catch (error) {
              handleError('getAllItems parse', key || 'unknown', error);
              return null;
            }
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      handleError('getAllItems', 'all', error);
      return [];
    }
  }, [keyPrefix, handleError]);

  // Utility to check if a key has been hydrated
  const isHydrated = useCallback((key: string): boolean => {
    return hydratedKeysRef.current.has(key);
  }, []);

  // Utility to manually mark a key as hydrated (useful for empty initial states)
  const markAsHydrated = useCallback((key: string, initialValue?: any) => {
    hydratedKeysRef.current.add(key);
    if (initialValue !== undefined) {
      lastSavedRef.current.set(key, initialValue);
    }
    log(`Manually marked key as hydrated: ${key}`);
  }, [log]);

  // Force immediate save (bypasses debouncing and change detection)
  const forceSetItem = useCallback(async (key: string, value: any): Promise<void> => {
    const storageKey = `${keyPrefix}:${key}`;
    
    try {
      // Cancel any pending debounced write
      const pendingWrite = pendingWritesRef.current.get(key);
      if (pendingWrite) {
        clearTimeout(pendingWrite);
        pendingWritesRef.current.delete(key);
      }

      const serializedValue = safeStringify(value);
      await AsyncStorage.setItem(storageKey, serializedValue);
      
      lastSavedRef.current.set(key, value);
      hydratedKeysRef.current.add(key);
      
      log(`Force saved key: ${key}`, value);
    } catch (error) {
      handleError('forceSetItem', key, error);
    }
  }, [keyPrefix, log, handleError]);

  return useMemo(() => ({
    getItem,
    setItem,
    deleteItem,
    getAllItems,
    forceSetItem,
    isHydrated,
    markAsHydrated,
  }), [getItem, setItem, deleteItem, getAllItems, forceSetItem, isHydrated, markAsHydrated]);
}