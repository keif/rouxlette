# Debug Payload Safety Guide

This guide explains how to prevent PayloadTooLargeError and AsyncStorage feedback loops in Rouxlette development.

## 🚨 Critical Issues We Prevent

### PayloadTooLargeError
- **Cause**: Large console.log payloads (>1MB) overwhelm Metro bundler's body-parser
- **Symptoms**: Metro crashes with "PayloadTooLargeError: request entity too large"
- **Common triggers**: Logging business arrays, API responses, large state objects

### AsyncStorage Feedback Loops  
- **Cause**: Rapid multiGet/multiSet operations without proper debouncing
- **Symptoms**: "Excessive number of pending callbacks: 501" warnings
- **Common triggers**: Saving state on every render, hydration without guards

## ✅ Safe Logging Utilities

### Replace Unsafe Patterns

```typescript
// ❌ NEVER DO THIS - Will cause PayloadTooLargeError
console.log('businesses:', businesses);
console.log('API response:', response.data);
console.log('Full state:', state);

// ✅ DO THIS INSTEAD
import { logSafe, logArray, logNetwork, logObject } from './utils/log';

// Safe general logging with size limits
logSafe('search-results', {
  count: businesses.length,
  firstBusiness: businesses[0]?.name,
  categories: [...new Set(businesses.map(b => b.categories?.[0]?.title))].slice(0, 5)
});

// Safe array logging with sampling
logArray('businesses', businesses, 3); // Shows 3 samples + metadata

// Safe API response logging
logNetwork('GET', '/businesses/search', params, {
  status: response.status,
  businessCount: response.data.businesses.length,
  total: response.data.total
});

// Safe object logging with selected fields
logObject('filters', filters, ['categoryIds', 'openNow', 'radiusMeters']);
```

### Context/State Debugging

```typescript
// ✅ Safe Context debugging
import { createContextLogger } from './utils/devtools';

const contextLogger = createContextLogger('SearchContext');

function reducer(state: AppState, action: Action) {
  const newState = { ...state, /* changes */ };
  
  // Automatically sanitizes large objects and sensitive fields
  contextLogger('state-update', { action: action.type, state: newState });
  
  return newState;
}
```

## 🔧 Safe Persistence Patterns

### Use Enhanced Hooks

```typescript
// ✅ Safe filters persistence with hydration guards
import { usePersistFilters } from './hooks/usePersistFilters';

function SearchContext() {
  const [filters, setFilters] = useState(initialFilters);
  
  // Properly debounced with change detection
  const { isHydrated } = usePersistFilters(filters, setFilters);
  
  // Only show UI after hydration to prevent flash
  if (!isHydrated) return <LoadingSpinner />;
  
  return <SearchInterface />;
}
```

### Selective Persistence Middleware

```typescript
// ✅ Only persist on specific actions
import { createPersistenceMiddleware } from './context/persistenceMiddleware';

const middleware = createPersistenceMiddleware({
  persistableActions: new Set(['SET_FILTERS', 'TOGGLE_FAVORITE']),
  debounceMs: 250
});

const enhancedReducer = middleware(reducer);
```

## 📊 State Architecture Best Practices

### Keep Large Data Outside Context

```typescript
// ✅ Separate large data from UI state
interface SlimAppState {
  // Only essential UI state
  filters: Filters;
  selectedBusinessId: string | null;
  showModal: boolean;
  
  // Just metadata, not full objects
  resultsMetadata: {
    count: number;
    lastUpdated: number;
    searchTerm: string;
  } | null;
}

// Large data managed separately
const useResultsView = (metadata) => {
  const dataStoreRef = useRef<BusinessDataStore>();
  // Businesses stored in ref, not state
};
```

## 🛡️ Automated Guardrails

### Pre-commit Hook
```bash
npm run lint:unsafe-logging
```

### Test Suite
```bash
npm test -- __tests__/guardrails/unsafeLogging.test.ts
```

### Manual Scanning
```bash
# Find potential issues
rg -n "console\.(log|dir)" src/
rg -n "JSON\.stringify" src/
rg -n "businesses.*console" src/
```

## 🚀 Migration Checklist

### 1. Replace Console Logging
- [ ] Search: `rg -n "console\.(log|dir|info|warn|error)" src/`
- [ ] Replace with: `logSafe()`, `logArray()`, `logNetwork()`
- [ ] Import: `import { logSafe } from './utils/log';`

### 2. Update Context Debugging  
- [ ] Search: `rg -n "console.*state" src/`
- [ ] Replace with: `createContextLogger()`
- [ ] Import: `import { createContextLogger } from './utils/devtools';`

### 3. Harden Persistence
- [ ] Replace direct AsyncStorage usage with safe hooks
- [ ] Add hydration guards to prevent saving during load
- [ ] Implement debounced writes with change detection
- [ ] Use selective persistence middleware

### 4. Test Migration
- [ ] Run: `npm run lint:unsafe-logging`
- [ ] Run: `npm test`
- [ ] Verify no PayloadTooLargeError in Metro
- [ ] Verify no AsyncStorage warnings

## 🔧 Performance Impact

### Safe Logging Overhead
- **Clipping**: <5ms for typical objects
- **Serialization safety**: <2ms additional
- **Size reduction**: >80% payload reduction

### Persistence Optimization
- **Debouncing**: 250ms default (configurable)
- **Change detection**: Deep equality with array sorting
- **Selective saves**: Only on specific actions

## ❗ Emergency Fixes

### Metro Crashes (PayloadTooLargeError)
1. **Find the culprit**: Check recent console.log additions
2. **Quick fix**: Comment out suspect logs
3. **Proper fix**: Replace with `logSafe()`
4. **Restart**: `npx expo start --clear`

### AsyncStorage Warnings
1. **Check persistence hooks**: Look for rapid saves
2. **Add hydration guards**: Ensure `isHydrated` checks
3. **Increase debounce**: Temporary 500ms delay
4. **Clear storage**: Test with fresh state

## 📝 Code Examples

### Safe Business Logging
```typescript
// ✅ Extract safe metadata
const businessMetadata = {
  count: businesses.length,
  categories: [...new Set(businesses.flatMap(b => 
    b.categories?.map(c => c.title) || []
  ))].slice(0, 5),
  ratings: {
    average: businesses.reduce((sum, b) => sum + b.rating, 0) / businesses.length,
    range: [Math.min(...businesses.map(b => b.rating)), Math.max(...businesses.map(b => b.rating))]
  },
  locations: businesses.length > 0 ? {
    firstCity: businesses[0]?.location?.city,
    uniqueCities: [...new Set(businesses.map(b => b.location?.city))].length
  } : null
};

logSafe('search-results', businessMetadata);
```

### Safe API Error Logging
```typescript
// ✅ Safe error logging
const logApiError = (error: AxiosError) => {
  logSafe('api-error', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    endpoint: error.config?.url,
    code: error.code,
    message: error.message,
    // Never log full response data
    hasResponseData: !!error.response?.data,
    responseType: typeof error.response?.data,
  });
};
```

This guide ensures your development experience remains smooth while preventing the critical issues that can crash Metro or flood AsyncStorage with excessive operations.