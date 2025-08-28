/**
 * Devtools sanitization utilities for React Context debugging
 * 
 * Prevents large state objects from overwhelming dev tools and causing
 * PayloadTooLargeError when using React DevTools or similar debugging tools.
 */

import { clip, LogSafeOptions } from './log';

/**
 * Configuration for state sanitization
 */
export interface SanitizeConfig extends LogSafeOptions {
  /** Fields to completely redact (show as "[REDACTED]") */
  redactFields?: string[];
  /** Fields to show metadata only (e.g., "Array(5)" instead of full array) */
  metadataOnlyFields?: string[];
  /** Maximum size in characters before sanitization kicks in */
  maxStateSize?: number;
}

const DEFAULT_SANITIZE_CONFIG: Required<SanitizeConfig> = {
  maxLength: 500,
  maxDepth: 2,
  maxItems: 5,
  showSizes: true,
  redactFields: ['photos', 'display_address', 'transactions'],
  metadataOnlyFields: ['businesses', 'results', 'categories', 'spinHistory'],
  maxStateSize: 10000,
};

/**
 * Sanitize state object for safe debugging/devtools display
 * 
 * @param state - State object to sanitize
 * @param config - Sanitization configuration
 * @returns Sanitized state safe for devtools
 */
export function sanitizeState(
  state: unknown,
  config: SanitizeConfig = {}
): unknown {
  const opts = { ...DEFAULT_SANITIZE_CONFIG, ...config };
  
  if (!state || typeof state !== 'object') {
    return state;
  }

  return sanitizeValue(state, opts, new Set(), '');
}

function sanitizeValue(
  value: unknown,
  config: Required<SanitizeConfig>,
  seen: Set<any>,
  keyPath: string
): unknown {
  // Prevent circular references
  if (value && typeof value === 'object' && seen.has(value)) {
    return '[CIRCULAR]';
  }

  // Handle primitives
  if (value === null || value === undefined || 
      typeof value === 'string' || typeof value === 'number' || 
      typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  // Add to seen set
  if (value && typeof value === 'object') {
    seen.add(value);
  }

  try {
    // Handle arrays
    if (Array.isArray(value)) {
      const fieldName = keyPath.split('.').pop() || '';
      
      if (config.metadataOnlyFields.includes(fieldName)) {
        return `Array(${value.length})${value.length > 0 ? ' - ' + getArraySummary(value) : ''}`;
      }
      
      return value.slice(0, config.maxItems).map((item, index) =>
        sanitizeValue(item, config, seen, `${keyPath}[${index}]`)
      );
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      const entries = Object.entries(value);
      
      for (const [key, val] of entries) {
        const currentPath = keyPath ? `${keyPath}.${key}` : key;
        
        // Check if field should be redacted
        if (config.redactFields.includes(key)) {
          result[key] = '[REDACTED]';
          continue;
        }
        
        // Check if field should show metadata only
        if (config.metadataOnlyFields.includes(key)) {
          if (Array.isArray(val)) {
            result[key] = `Array(${val.length})${val.length > 0 ? ' - ' + getArraySummary(val) : ''}`;
          } else if (val && typeof val === 'object') {
            result[key] = `Object(${Object.keys(val).length} keys)`;
          } else {
            result[key] = val;
          }
          continue;
        }
        
        // Recursively sanitize other fields
        result[key] = sanitizeValue(val, config, seen, currentPath);
      }
      
      return result;
    }

    return clip(value, config);
  } finally {
    if (value && typeof value === 'object') {
      seen.delete(value);
    }
  }
}

/**
 * Get a brief summary of array contents
 */
function getArraySummary(array: unknown[]): string {
  if (array.length === 0) return 'empty';
  
  const first = array[0];
  if (first && typeof first === 'object' && 'name' in first) {
    return `first: "${(first as any).name}"`;
  }
  if (first && typeof first === 'object' && 'id' in first) {
    return `first id: "${(first as any).id}"`;
  }
  if (typeof first === 'string') {
    return `first: "${first.slice(0, 20)}${first.length > 20 ? '...' : ''}"`;
  }
  
  return `type: ${typeof first}`;
}

/**
 * React Context debugging wrapper that sanitizes state before logging
 */
export function createContextLogger<T>(contextName: string, config?: SanitizeConfig) {
  const sanitizeConfig = { ...DEFAULT_SANITIZE_CONFIG, ...config };
  
  return {
    /**
     * Log state change with sanitization
     */
    logStateChange: (action: { type: string; payload?: unknown }, oldState: T, newState: T) => {
      if (!__DEV__) return;
      
      const sanitizedAction = sanitizeState({
        type: action.type,
        payload: action.payload
      }, { ...sanitizeConfig, maxDepth: 1 });
      
      const sanitizedOldState = sanitizeState(oldState, sanitizeConfig);
      const sanitizedNewState = sanitizeState(newState, sanitizeConfig);
      
      console.group(`[${contextName}] ${action.type}`);
      console.log('Action:', sanitizedAction);
      console.log('Old State:', sanitizedOldState);
      console.log('New State:', sanitizedNewState);
      console.groupEnd();
    },
    
    /**
     * Log current state with sanitization
     */
    logCurrentState: (state: T, label = 'Current State') => {
      if (!__DEV__) return;
      
      const sanitized = sanitizeState(state, sanitizeConfig);
      console.log(`[${contextName}] ${label}:`, sanitized);
    },
    
    /**
     * Log action without state for performance-sensitive operations
     */
    logAction: (action: { type: string; payload?: unknown }) => {
      if (!__DEV__) return;
      
      const sanitized = sanitizeState(action, { ...sanitizeConfig, maxDepth: 1 });
      console.log(`[${contextName}] Action:`, sanitized);
    }
  };
}

/**
 * Redux DevTools Extension sanitization configuration
 * Use this if you ever add Redux DevTools to the React Context
 */
export const REDUX_DEVTOOLS_CONFIG = {
  serialize: {
    options: {
      maxDepth: 2,
      maxSize: 10000,
    },
    replacer: (key: string, val: unknown) => {
      // Redact large arrays and objects
      if (Array.isArray(val) && val.length > 10) {
        return `Array(${val.length}) [TRUNCATED]`;
      }
      
      if (val && typeof val === 'object' && Object.keys(val).length > 20) {
        return `Object(${Object.keys(val).length} keys) [TRUNCATED]`;
      }
      
      // Redact sensitive fields
      if (['photos', 'display_address', 'transactions'].includes(key)) {
        return '[REDACTED]';
      }
      
      return val;
    }
  },
  actionSanitizer: (action: any) => ({
    type: action.type,
    payload: sanitizeState(action.payload, {
      maxDepth: 1,
      maxItems: 3,
      metadataOnlyFields: ['businesses', 'results']
    })
  }),
  stateSanitizer: (state: any) => sanitizeState(state, DEFAULT_SANITIZE_CONFIG)
};

/**
 * Wrapper for React.useReducer that adds optional debug logging
 */
export function useReducerWithLogging<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  contextName: string,
  enableLogging: boolean = __DEV__
): [S, React.Dispatch<A>] {
  const logger = React.useMemo(() => 
    createContextLogger<S>(contextName), [contextName]
  );
  
  const loggingReducer = React.useCallback((state: S, action: A) => {
    const newState = reducer(state, action);
    
    if (enableLogging && state !== newState) {
      logger.logStateChange(action, state, newState);
    }
    
    return newState;
  }, [reducer, enableLogging, logger]);
  
  return React.useReducer(loggingReducer, initialState);
}

/**
 * Higher-order component for debugging Context providers
 */
export function withContextLogging<T>(
  Provider: React.ComponentType<{ value: T; children: React.ReactNode }>,
  contextName: string,
  config?: SanitizeConfig
) {
  return function LoggingProvider({ 
    value, 
    children 
  }: { 
    value: T; 
    children: React.ReactNode 
  }) {
    const logger = createContextLogger<T>(contextName, config);
    const prevValue = React.useRef(value);
    
    React.useEffect(() => {
      if (prevValue.current !== value) {
        logger.logCurrentState(value, 'Context Value Changed');
        prevValue.current = value;
      }
    }, [value, logger]);
    
    return React.createElement(Provider, { value, children });
  };
}

export default {
  sanitizeState,
  createContextLogger,
  useReducerWithLogging,
  withContextLogging,
  REDUX_DEVTOOLS_CONFIG,
};