/**
 * Tests for usePersistFilters hook to ensure proper hydration and debouncing
 */

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePersistFilters } from '../usePersistFilters';
import { initialFilters, type Filters } from '../../context/stateRefactored';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock safe logging
jest.mock('../../utils/log', () => ({
  logSafe: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock __DEV__ for testing
(global as any).__DEV__ = true;

describe('usePersistFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should hydrate from storage on mount', async () => {
    const storedFilters: Filters = {
      ...initialFilters,
      categoryIds: ['restaurants'],
      openNow: true,
    };

    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedFilters));

    const onHydrated = jest.fn();
    
    const { result } = renderHook(() => 
      usePersistFilters(initialFilters, onHydrated)
    );

    // Initially not hydrated
    expect(result.current.isHydrated).toBe(false);

    // Wait for hydration
    await act(async () => {
      await Promise.resolve(); // Let the effect run
    });

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@roux:filters');
    expect(onHydrated).toHaveBeenCalledWith(storedFilters);
    expect(result.current.isHydrated).toBe(true);
  });

  test('should use defaults when no stored filters exist', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const onHydrated = jest.fn();
    
    const { result } = renderHook(() => 
      usePersistFilters(initialFilters, onHydrated)
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(onHydrated).toHaveBeenCalledWith(initialFilters);
    expect(result.current.isHydrated).toBe(true);
  });

  test('should handle storage errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

    const onHydrated = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => 
      usePersistFilters(initialFilters, onHydrated)
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleError).toHaveBeenCalled();
    expect(onHydrated).toHaveBeenCalledWith(initialFilters);
    expect(result.current.isHydrated).toBe(true);

    consoleError.mockRestore();
  });

  test('should not save filters before hydration', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const modifiedFilters: Filters = {
      ...initialFilters,
      openNow: true,
    };

    const { rerender } = renderHook(
      ({ filters }) => usePersistFilters(filters),
      { initialProps: { filters: initialFilters } }
    );

    // Change filters before hydration completes
    rerender({ filters: modifiedFilters });

    // Fast-forward timers but don't resolve hydration
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not have called setItem yet
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();

    // Now complete hydration
    await act(async () => {
      await Promise.resolve();
    });

    // Should still not save during hydration
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('should debounce saves after hydration', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result, rerender } = renderHook(
      ({ filters }) => usePersistFilters(filters),
      { initialProps: { filters: initialFilters } }
    );

    // Complete hydration
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isHydrated).toBe(true);

    // Change filters multiple times quickly
    const filters1: Filters = { ...initialFilters, openNow: true };
    const filters2: Filters = { ...filters1, radiusMeters: 3200 };
    const filters3: Filters = { ...filters2, categoryIds: ['restaurants'] };

    rerender({ filters: filters1 });
    rerender({ filters: filters2 });
    rerender({ filters: filters3 });

    // Should not save immediately
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();

    // Advance time to trigger debounced save
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should save only the final state
    expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      '@roux:filters',
      JSON.stringify(filters3)
    );
  });

  test('should not save when filters are unchanged', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(initialFilters));

    const { rerender } = renderHook(
      ({ filters }) => usePersistFilters(filters),
      { initialProps: { filters: initialFilters } }
    );

    // Complete hydration
    await act(async () => {
      await Promise.resolve();
    });

    // "Change" to the same filters (should be detected as no change)
    rerender({ filters: { ...initialFilters } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not save since filters didn't actually change
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('should detect changes in array order', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result, rerender } = renderHook(
      ({ filters }) => usePersistFilters(filters),
      { initialProps: { filters: initialFilters } }
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Arrays with same content but different order should be considered equal
    const filters1: Filters = {
      ...initialFilters,
      categoryIds: ['restaurants', 'bars'],
      priceLevels: [1, 2],
    };

    const filters2: Filters = {
      ...initialFilters,
      categoryIds: ['bars', 'restaurants'], // Different order
      priceLevels: [2, 1], // Different order
    };

    rerender({ filters: filters1 });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    rerender({ filters: filters2 });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not save again since arrays have same content (order-independent)
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('should provide force save functionality', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => 
      usePersistFilters(initialFilters)
    );

    await act(async () => {
      await Promise.resolve();
    });

    const testFilters: Filters = {
      ...initialFilters,
      openNow: true,
    };

    // Force save (bypasses debounce)
    await act(async () => {
      await result.current.forceSave(testFilters);
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      '@roux:filters',
      JSON.stringify(testFilters)
    );
  });

  test('should provide clear functionality', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => 
      usePersistFilters(initialFilters)
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.clearStored();
    });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@roux:filters');
  });

  test('should provide debug information', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result, rerender } = renderHook(
      ({ filters }) => usePersistFilters(filters),
      { initialProps: { filters: initialFilters } }
    );

    // Before hydration
    expect(result.current.getDebugInfo().isHydrated).toBe(false);
    expect(result.current.getDebugInfo().lastSaved).toBe(null);

    await act(async () => {
      await Promise.resolve();
    });

    // After hydration
    expect(result.current.getDebugInfo().isHydrated).toBe(true);

    // Schedule a save to test pending write detection
    rerender({ filters: { ...initialFilters, openNow: true } });

    expect(result.current.getDebugInfo().hasPendingWrite).toBe(true);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.getDebugInfo().hasPendingWrite).toBe(false);
  });

  test('should cleanup timers on unmount', async () => {
    const { result, unmount, rerender } = renderHook(
      ({ filters }) => usePersistFilters(filters),
      { initialProps: { filters: initialFilters } }
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Schedule a save
    rerender({ filters: { ...initialFilters, openNow: true } });

    expect(result.current.getDebugInfo().hasPendingWrite).toBe(true);

    // Unmount before timer fires
    unmount();

    // Advance time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not have saved after unmount
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });
});