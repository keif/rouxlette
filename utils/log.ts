/**
 * Safe logging utilities to prevent PayloadTooLargeError in Expo dev server
 * 
 * These utilities prevent massive console.log payloads that can overwhelm
 * the Metro bundler's body-parser and cause "request entity too large" errors.
 */

export interface LogSafeOptions {
  /** Maximum string length before truncation (default: 5000) */
  maxLength?: number;
  /** Maximum object depth to serialize (default: 3) */
  maxDepth?: number;
  /** Maximum number of array items to show (default: 10) */
  maxItems?: number;
  /** Show object/array sizes when truncated (default: true) */
  showSizes?: boolean;
}

const DEFAULT_OPTIONS: Required<LogSafeOptions> = {
  maxLength: 5000,
  maxDepth: 3,
  maxItems: 10,
  showSizes: true,
};

/**
 * Safely clip/truncate any value to prevent large console payloads
 * 
 * @param value - Any value to clip
 * @param options - Clipping options
 * @returns Clipped version safe for logging
 */
export function clip(value: unknown, options: LogSafeOptions = {}): unknown {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return clipValue(value, opts, 0, new Set());
}

function clipValue(
  value: unknown, 
  options: Required<LogSafeOptions>, 
  depth: number,
  seen: Set<any>
): unknown {
  // Prevent infinite recursion
  if (depth > options.maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle primitives
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > options.maxLength) {
      return `${value.slice(0, options.maxLength)}... [TRUNCATED: ${value.length} chars]`;
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (typeof value === 'bigint') {
    return value.toString() + 'n';
  }

  // Handle circular references
  if (seen.has(value)) {
    return '[CIRCULAR]';
  }
  seen.add(value);

  try {
    // Handle arrays
    if (Array.isArray(value)) {
      const clipped = value.slice(0, options.maxItems).map(item => 
        clipValue(item, options, depth + 1, seen)
      );
      
      if (value.length > options.maxItems && options.showSizes) {
        clipped.push(`[TRUNCATED: ${value.length - options.maxItems} more items]`);
      }
      
      return clipped;
    }

    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle Error objects
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack?.slice(0, 500) + '...[TRUNCATED]'
      };
    }

    // Handle regular objects
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      const entries = Object.entries(value);
      
      // Limit number of properties shown
      const maxProps = Math.min(entries.length, 20);
      
      for (let i = 0; i < maxProps; i++) {
        const [key, val] = entries[i];
        result[key] = clipValue(val, options, depth + 1, seen);
      }
      
      if (entries.length > maxProps && options.showSizes) {
        result['[TRUNCATED]'] = `${entries.length - maxProps} more properties`;
      }
      
      return result;
    }

    return value;
  } finally {
    seen.delete(value);
  }
}

/**
 * Safe console.log replacement that automatically clips large payloads
 * 
 * @param label - Descriptive label for the log
 * @param value - Value to log (will be clipped if too large)
 * @param options - Clipping options
 */
export function logSafe(
  label: string, 
  value: unknown, 
  options: LogSafeOptions = {}
): void {
  if (!__DEV__) {
    return; // No logging in production
  }

  try {
    const clipped = clip(value, options);
    
    // Additional safety: check final string size
    try {
      const serialized = JSON.stringify(clipped);
      if (serialized && serialized.length > 10000) {
        console.log(`[${label}] [PAYLOAD_TOO_LARGE: ${serialized.length} chars]`);
        return;
      }
      
      console.log(`[${label}]`, clipped);
    } catch (stringifyError) {
      // If JSON.stringify fails, fall back to string representation
      console.log(`[${label}] [SERIALIZATION_ERROR: ${stringifyError instanceof Error ? stringifyError.message : 'Unknown stringify error'}]`);
    }
  } catch (clipError) {
    // If even clipping fails, show the error
    console.log(`[${label}] [CLIP_ERROR: ${clipError instanceof Error ? clipError.message : 'Unknown clip error'}]`);
  }
}

/**
 * Safe console.log for arrays that shows count + sample items
 * 
 * @param label - Descriptive label
 * @param array - Array to log safely  
 * @param sampleSize - Number of sample items to show (default: 3)
 */
export function logArray<T>(
  label: string,
  array: T[],
  sampleSize: number = 3
): void {
  if (!__DEV__) return;

  if (!Array.isArray(array)) {
    logSafe(`${label} [NOT_ARRAY]`, array);
    return;
  }

  const sample = array.slice(0, sampleSize).map(item => clip(item, { maxDepth: 2 }));
  
  console.log(`[${label}] Array(${array.length})`, {
    count: array.length,
    sample,
    ...(array.length > sampleSize && { truncated: array.length - sampleSize })
  });
}

/**
 * Safe console.log for objects that shows keys + selected values
 * 
 * @param label - Descriptive label
 * @param obj - Object to log safely
 * @param keySelection - Keys to include, or 'all' for all keys (default: first 5)
 */
export function logObject(
  label: string,
  obj: Record<string, unknown>,
  keySelection: string[] | 'all' | number = 5
): void {
  if (!__DEV__) return;

  if (typeof obj !== 'object' || obj === null) {
    logSafe(`${label} [NOT_OBJECT]`, obj);
    return;
  }

  const allKeys = Object.keys(obj);
  let selectedKeys: string[];

  if (keySelection === 'all') {
    selectedKeys = allKeys;
  } else if (Array.isArray(keySelection)) {
    selectedKeys = keySelection.filter(key => key in obj);
  } else {
    selectedKeys = allKeys.slice(0, keySelection);
  }

  const result: Record<string, unknown> = {
    '[KEYS_COUNT]': allKeys.length,
    '[KEYS]': allKeys.slice(0, 10), // Show first 10 keys
  };

  selectedKeys.forEach(key => {
    result[key] = clip(obj[key], { maxDepth: 2 });
  });

  if (allKeys.length > selectedKeys.length) {
    result['[TRUNCATED_KEYS]'] = allKeys.length - selectedKeys.length;
  }

  console.log(`[${label}]`, result);
}

/**
 * Performance-aware logging that measures and logs execution time
 * 
 * @param label - Operation label
 * @param fn - Function to execute and measure
 * @returns Result of the function
 */
export async function logPerf<T>(
  label: string,
  fn: () => T | Promise<T>
): Promise<T> {
  if (!__DEV__) {
    return await fn();
  }

  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`[PERF:${label}] ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.log(`[PERF:${label}] FAILED after ${duration.toFixed(2)}ms`, clip(error));
    throw error;
  }
}

/**
 * Network request logging helper
 * 
 * @param method - HTTP method
 * @param url - Request URL
 * @param params - Request parameters (will be clipped)
 * @param response - Response data (will be clipped to metadata only)
 */
export function logNetwork(
  method: string,
  url: string,
  params?: Record<string, unknown>,
  response?: { status?: number; data?: unknown; duration?: number }
): void {
  if (!__DEV__) return;

  const logData: Record<string, unknown> = {
    method: method.toUpperCase(),
    url: url.replace(/https?:\/\/[^/]+/, ''), // Remove domain for brevity
  };

  if (params) {
    logData.params = clip(params, { maxDepth: 1, maxItems: 5 });
  }

  if (response) {
    logData.status = response.status;
    logData.duration = response.duration ? `${response.duration.toFixed(0)}ms` : undefined;
    
    // For response data, only log metadata, never full payloads
    if (response.data && typeof response.data === 'object') {
      const data = response.data as any;
      if (Array.isArray(data)) {
        logData.response = `Array(${data.length})`;
      } else if (data.businesses && Array.isArray(data.businesses)) {
        // Yelp API response shape
        logData.response = {
          businesses: `Array(${data.businesses.length})`,
          total: data.total,
          region: data.region ? 'present' : undefined
        };
      } else {
        logData.response = `Object(${Object.keys(data).length} keys)`;
      }
    } else {
      logData.response = typeof response.data;
    }
  }

  console.log('[NETWORK]', logData);
}

/**
 * React component logging helper for debugging renders
 * 
 * @param componentName - Name of the component
 * @param props - Component props (will be clipped)
 * @param renderCount - Optional render count
 */
export function logRender(
  componentName: string,
  props?: Record<string, unknown>,
  renderCount?: number
): void {
  if (!__DEV__) return;

  const logData: Record<string, unknown> = {
    component: componentName,
    ...(renderCount && { renderCount }),
  };

  if (props) {
    // Only log non-function props to avoid noise
    const nonFunctionProps = Object.entries(props)
      .filter(([_, value]) => typeof value !== 'function')
      .reduce((acc, [key, value]) => {
        acc[key] = clip(value, { maxDepth: 1 });
        return acc;
      }, {} as Record<string, unknown>);

    if (Object.keys(nonFunctionProps).length > 0) {
      logData.props = nonFunctionProps;
    }
  }

  console.log('[RENDER]', logData);
}

/**
 * Safe JSON.stringify replacement that handles circular references
 * and prevents Metro bundler crashes from large objects
 * 
 * @param value - Value to stringify
 * @param options - Clipping options
 * @returns Safe JSON string
 */
export function safeStringify(
  value: unknown,
  options: LogSafeOptions = {}
): string {
  try {
    const clipped = clip(value, {
      maxDepth: 3,
      maxItems: 10,
      maxLength: 1000,
      showSizes: true,
      ...options
    });
    
    const result = JSON.stringify(clipped);
    return result ?? '[NULL_SERIALIZATION_RESULT]';
  } catch (error) {
    // Fallback for any remaining edge cases
    return `[SERIALIZATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

// Export commonly used configurations
export const LOG_CONFIGS = {
  minimal: { maxDepth: 1, maxItems: 3, maxLength: 100 },
  standard: { maxDepth: 3, maxItems: 10, maxLength: 1000 },
  verbose: { maxDepth: 5, maxItems: 20, maxLength: 5000 },
} as const;