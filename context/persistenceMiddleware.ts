/**
 * Reducer middleware for selective persistence
 * 
 * Only persists state on specific actions to prevent feedback loops
 * and reduce AsyncStorage write volume.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SlimAppState } from './stateRefactored';
import { logSafe, safeStringify } from '../utils/log';

/**
 * Actions that should trigger persistence
 */
export const PERSISTABLE_ACTIONS = new Set([
  'SET_FILTERS',
  'RESET_FILTERS',
  'TOGGLE_FAVORITE',
  'ADD_FAVORITE',
  'REMOVE_FAVORITE',
  'ADD_SPIN_HISTORY',
  'CLEAR_SPIN_HISTORY',
  'SET_LOCATION', // Only if we want to persist last search location
]);

/**
 * Configuration for selective persistence
 */
export interface PersistenceConfig {
  /** Storage key prefix */
  keyPrefix: string;
  /** Actions that trigger persistence */
  persistableActions: Set<string>;
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Enable debug logging */
  debug: boolean;
}

const DEFAULT_CONFIG: PersistenceConfig = {
  keyPrefix: '@roux',
  persistableActions: PERSISTABLE_ACTIONS,
  debounceMs: 250,
  debug: __DEV__,
};

/**
 * Debounced write manager
 */
class DebouncedWriter {
  private pendingWrites = new Map<string, NodeJS.Timeout>();
  private config: PersistenceConfig;
  
  constructor(config: PersistenceConfig) {
    this.config = config;
  }
  
  /**
   * Schedule a debounced write
   */
  write(key: string, data: unknown): void {
    // Clear any pending write for this key
    const existing = this.pendingWrites.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    
    // Schedule new write
    const timeout = setTimeout(() => {
      this.performWrite(key, data);
      this.pendingWrites.delete(key);
    }, this.config.debounceMs);
    
    this.pendingWrites.set(key, timeout);
    
    if (this.config.debug) {
      logSafe('DebouncedWriter:scheduled', { key, pendingCount: this.pendingWrites.size });
    }
  }
  
  /**
   * Force immediate write (bypasses debounce)
   */
  async forceWrite(key: string, data: unknown): Promise<void> {
    // Cancel any pending debounced write
    const existing = this.pendingWrites.get(key);
    if (existing) {
      clearTimeout(existing);
      this.pendingWrites.delete(key);
    }
    
    await this.performWrite(key, data);
  }
  
  private async performWrite(key: string, data: unknown): Promise<void> {
    try {
      const storageKey = `${this.config.keyPrefix}:${key}`;
      const serialized = safeStringify(data);
      
      await AsyncStorage.setItem(storageKey, serialized);
      
      if (this.config.debug) {
        logSafe('DebouncedWriter:wrote', {
          key,
          size: serialized.length,
          data: typeof data === 'object' && data !== null 
            ? `${Object.keys(data).length} keys` 
            : typeof data
        });
      }
    } catch (error: any) {
      logSafe(`[DebouncedWriter] Failed to write ${key}`, { message: error?.message });
    }
  }
  
  /**
   * Clear all pending writes
   */
  clearPending(): void {
    for (const timeout of this.pendingWrites.values()) {
      clearTimeout(timeout);
    }
    this.pendingWrites.clear();
  }
}

/**
 * Create persistence middleware
 */
export function createPersistenceMiddleware<S, A extends { type: string }>(
  config: Partial<PersistenceConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const writer = new DebouncedWriter(finalConfig);
  
  /**
   * Middleware function that wraps your reducer
   */
  return function persistenceMiddleware(
    reducer: (state: S, action: A) => S
  ) {
    return function enhancedReducer(state: S, action: A): S {
      // Run the original reducer
      const newState = reducer(state, action);
      
      // Check if this action should trigger persistence
      if (!finalConfig.persistableActions.has(action.type)) {
        return newState;
      }
      
      if (finalConfig.debug) {
        logSafe('persistenceMiddleware:action', {
          type: action.type,
          willPersist: true
        });
      }
      
      // Persist relevant state slices based on action
      persistStateSlices(action, newState, writer, finalConfig);
      
      return newState;
    };
  };
}

/**
 * Persist specific state slices based on action type
 */
function persistStateSlices<S, A extends { type: string }>(
  action: A,
  state: S,
  writer: DebouncedWriter,
  config: PersistenceConfig
): void {
  const slimState = state as SlimAppState;
  
  switch (action.type) {
    case 'SET_FILTERS':
    case 'RESET_FILTERS':
      // Only persist filters
      writer.write('filters', slimState.filters);
      break;
      
    case 'ADD_FAVORITE':
    case 'REMOVE_FAVORITE':
    case 'TOGGLE_FAVORITE':
      // Persist favorites list (just IDs)
      writer.write('favorites', slimState.favoriteBusinessIds);
      break;
      
    case 'ADD_SPIN_HISTORY':
      // Persist spin history (minimal refs)
      writer.write('spinHistory', slimState.spinHistory);
      break;
      
    case 'CLEAR_SPIN_HISTORY':
      // Clear spin history
      writer.write('spinHistory', []);
      break;
      
    case 'SET_LOCATION':
      // Optional: persist last search location
      if (slimState.location) {
        writer.write('lastLocation', slimState.location);
      }
      break;
      
    default:
      if (config.debug) {
        logSafe('persistenceMiddleware:unhandled', action.type);
      }
  }
}

/**
 * Hook to use reducer with persistence middleware
 */
export function useReducerWithPersistence<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  config?: Partial<PersistenceConfig>
): [S, React.Dispatch<A>] {
  const middleware = React.useMemo(() => 
    createPersistenceMiddleware<S, A>(config), [config]
  );
  
  const enhancedReducer = React.useMemo(() => 
    middleware(reducer), [middleware, reducer]
  );
  
  return React.useReducer(enhancedReducer, initialState);
}

/**
 * Hydration utilities for loading persisted state on app start
 */
export class StateHydrator {
  private config: PersistenceConfig;
  
  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Load all persisted state slices
   */
  async loadPersistedState(): Promise<Partial<SlimAppState>> {
    try {
      const [filters, favorites, spinHistory, lastLocation] = await Promise.all([
        this.loadSlice('filters'),
        this.loadSlice('favorites'),
        this.loadSlice('spinHistory'),
        this.loadSlice('lastLocation'),
      ]);
      
      const result: Partial<SlimAppState> = {};
      
      if (filters) result.filters = filters;
      if (favorites) result.favoriteBusinessIds = favorites;
      if (spinHistory) result.spinHistory = spinHistory;
      if (lastLocation) result.location = lastLocation;
      
      if (this.config.debug) {
        logSafe('StateHydrator:loaded', {
          filters: !!filters,
          favorites: Array.isArray(favorites) ? favorites.length : 0,
          spinHistory: Array.isArray(spinHistory) ? spinHistory.length : 0,
          lastLocation: !!lastLocation
        });
      }
      
      return result;
    } catch (error: any) {
      logSafe('[StateHydrator] Failed to load persisted state', { message: error?.message });
      return {};
    }
  }
  
  private async loadSlice(key: string): Promise<unknown | null> {
    try {
      const storageKey = `${this.config.keyPrefix}:${key}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      return null;
    } catch (error: any) {
      logSafe(`[StateHydrator] Failed to load ${key}`, { message: error?.message });
      return null;
    }
  }
  
  /**
   * Clear all persisted state
   */
  async clearPersistedState(): Promise<void> {
    const keys = ['filters', 'favorites', 'spinHistory', 'lastLocation'];
    
    await Promise.all(
      keys.map(key => 
        AsyncStorage.removeItem(`${this.config.keyPrefix}:${key}`)
      )
    );
    
    if (this.config.debug) {
      logSafe('StateHydrator:cleared', 'All persisted state cleared');
    }
  }
}

/**
 * Example integration with React Context
 */
export function createPersistedContext<S extends SlimAppState, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  contextName: string = 'PersistedContext'
) {
  const Context = React.createContext<{
    state: S;
    dispatch: React.Dispatch<A>;
  } | null>(null);
  
  function Provider({ children }: { children: React.ReactNode }) {
    const [isHydrated, setIsHydrated] = React.useState(false);
    const [hydratedState, setHydratedState] = React.useState<S>(initialState);
    
    // Hydrate state on mount
    React.useEffect(() => {
      const hydrator = new StateHydrator({ debug: __DEV__ });
      
      hydrator.loadPersistedState().then(persistedState => {
        const merged = { ...initialState, ...persistedState } as S;
        setHydratedState(merged);
        setIsHydrated(true);
      });
    }, []);
    
    // Use reducer with persistence
    const [state, dispatch] = useReducerWithPersistence(
      reducer,
      hydratedState,
      { debug: __DEV__ }
    );
    
    // Don't render children until hydrated to prevent flash
    if (!isHydrated) {
      return null; // or <LoadingSpinner />
    }
    
    return React.createElement(Context.Provider, {
      value: { state, dispatch },
      children
    });
  }
  
  function useContext() {
    const context = React.useContext(Context);
    if (!context) {
      throw new Error(`useContext must be used within ${contextName}.Provider`);
    }
    return context;
  }
  
  return {
    Context,
    Provider,
    useContext,
  };
}