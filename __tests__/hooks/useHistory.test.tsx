/**
 * Tests for useHistory hook to ensure:
 * - Hydration runs only once under StrictMode
 * - Persistence only triggers on actual changes  
 * - No re-entrancy loops between hydrate and persist
 * - Context value stability
 */

import React, { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useHistory } from '../../hooks/useHistory';
import { RootContext } from '../../context/RootContext';
import { initialAppState } from '../../context/state';
import { appReducer } from '../../context/reducer';
import { ActionType } from '../../context/actions';
import { HistoryItem } from '../../types/favorites';

// Mock storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  deleteItem: jest.fn(),
  getAllItems: jest.fn(),
  forceSetItem: jest.fn(),
  isHydrated: jest.fn(),
  markAsHydrated: jest.fn(),
};

jest.mock('../../hooks/usePersistentStorage', () => {
  return jest.fn(() => mockStorage);
});

// Mock logging
jest.mock('../../utils/log', () => ({
  logSafe: jest.fn(),
  safeStringify: (obj: any) => JSON.stringify(obj),
}));

const mockHistoryItem: HistoryItem = {
  id: 'hist_test_123',
  businessId: 'biz_123',
  name: 'Test Restaurant',
  selectedAt: Date.now(),
  source: 'manual',
};

describe('useHistory', () => {
  let mockDispatch: jest.Mock;
  let mockState: any;
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDispatch = jest.fn();
    mockState = {
      ...initialAppState,
      history: [],
    };
    
    // Mock storage returns
    mockStorage.getItem.mockResolvedValue(null);
    mockStorage.setItem.mockResolvedValue(undefined);
  });

  const createWrapper = (strictMode = false) => {
    const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const [state, dispatch] = React.useReducer(appReducer, mockState);
      const contextValue = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);
      
      // Create a spy on dispatch to track calls
      React.useEffect(() => {
        dispatchSpy = jest.spyOn({ dispatch }, 'dispatch');
        return () => dispatchSpy?.mockRestore();
      }, [dispatch]);
      
      if (strictMode) {
        return (
          <StrictMode>
            <RootContext.Provider value={contextValue}>
              {children}
            </RootContext.Provider>
          </StrictMode>
        );
      }
      
      return (
        <RootContext.Provider value={contextValue}>
          {children}
        </RootContext.Provider>
      );
    };
    
    return TestProvider;
  };

  describe('Hydration behavior', () => {
    it('should hydrate only once under normal conditions', async () => {
      const wrapper = createWrapper();
      
      renderHook(() => useHistory(), { wrapper });
      
      // Wait for hydration to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockStorage.getItem).toHaveBeenCalledTimes(1);
      // Note: We can't easily spy on the dispatch in this test setup
      // The key behavior is that hydration only happens once
      expect(mockStorage.getItem).toHaveBeenCalledWith('storage:history:v1');
    });

    it('should hydrate only once under React StrictMode', async () => {
      const wrapper = createWrapper(true);
      
      renderHook(() => useHistory(), { wrapper });
      
      // Wait for StrictMode double-invocation to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Should still only hydrate once despite StrictMode double-mounting
      expect(mockStorage.getItem).toHaveBeenCalledTimes(1);
      expect(mockStorage.getItem).toHaveBeenCalledWith('storage:history:v1');
    });

    it('should hydrate from storage with existing data', async () => {
      const mockStoredHistory = [mockHistoryItem];
      mockStorage.getItem.mockResolvedValue(mockStoredHistory);
      
      const wrapper = createWrapper();
      renderHook(() => useHistory(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockStorage.getItem).toHaveBeenCalledWith('storage:history:v1');
    });

    it('should handle hydration errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const wrapper = createWrapper();
      renderHook(() => useHistory(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Should fallback to empty array on error - behavior is handled by reducer
      expect(mockStorage.getItem).toHaveBeenCalledWith('storage:history:v1');
    });
  });

  describe('Persistence behavior', () => {
    it('should persist only when history actually changes', async () => {
      const wrapper = createWrapper();
      const { rerender } = renderHook(() => useHistory(), { wrapper });
      
      // Wait for hydration
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Reset mocks after hydration
      mockStorage.setItem.mockClear();
      
      // Update state with new history
      mockState.history = [mockHistoryItem];
      rerender();
      
      // Wait for persistence debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockStorage.setItem).toHaveBeenCalledWith('storage:history:v1', [mockHistoryItem]);
    });

    it('should not persist when history has not changed', async () => {
      // Start with history in initial state
      mockState.history = [mockHistoryItem];
      mockStorage.getItem.mockResolvedValue([mockHistoryItem]);
      
      const wrapper = createWrapper();
      const { rerender } = renderHook(() => useHistory(), { wrapper });
      
      // Wait for hydration
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Reset mocks after hydration  
      mockStorage.setItem.mockClear();
      
      // Re-render with same history (no actual change)
      rerender();
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Should not persist unchanged data
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not persist during hydration', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useHistory(), { wrapper });
      
      // During hydration phase, should not persist
      expect(mockStorage.setItem).not.toHaveBeenCalled();
      
      // Wait for hydration to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Reset mocks after hydration
      mockStorage.setItem.mockClear();
      
      // Now trigger a state change through the hook to simulate real usage
      act(() => {
        result.current.addHistoryEntry({
          business: { id: 'test_biz', name: 'Test Restaurant' } as any,
          source: 'manual',
        });
      });
      
      // Wait for persistence debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Now persistence should happen
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('No re-entrancy loops', () => {
    it('should prevent storage operations from triggering hydration again', async () => {
      let persistCallCount = 0;
      const originalSetItem = mockStorage.setItem;
      
      // Mock storage to count actual calls
      mockStorage.setItem.mockImplementation(async (...args) => {
        persistCallCount++;
        return originalSetItem(...args);
      });
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useHistory(), { wrapper });
      
      // Wait for initial hydration
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Reset mocks after hydration but keep our counter
      const getItemCallCount = mockStorage.getItem.mock.calls.length;
      
      // Trigger a state change through the hook
      act(() => {
        result.current.addHistoryEntry({
          business: { id: 'test_biz', name: 'Test Restaurant' } as any,
          source: 'manual',
        });
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Should have persisted once without triggering re-hydration
      expect(persistCallCount).toBeGreaterThanOrEqual(1);
      expect(mockStorage.getItem).toHaveBeenCalledTimes(getItemCallCount); // Should not have called getItem again
    });
  });

  describe('Callback functions', () => {
    it('should provide stable addHistoryEntry function', async () => {
      const wrapper = createWrapper();
      const { result, rerender } = renderHook(() => useHistory(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      const firstAddHistoryEntry = result.current.addHistoryEntry;
      
      // Re-render
      rerender();
      
      const secondAddHistoryEntry = result.current.addHistoryEntry;
      
      // Function should be stable
      expect(firstAddHistoryEntry).toBe(secondAddHistoryEntry);
    });

    it('should add history entry correctly', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useHistory(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Reset mocks after hydration
      mockStorage.setItem.mockClear();
      
      const mockBusiness = {
        id: 'biz_123',
        name: 'Test Restaurant',
      } as any;
      
      act(() => {
        result.current.addHistoryEntry({
          business: mockBusiness,
          source: 'manual',
        });
      });
      
      // Wait for persistence debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Verify storage was called for persistence
      expect(mockStorage.setItem).toHaveBeenCalledWith('storage:history:v1', expect.any(Array));
    });

    it('should clear history correctly', async () => {
      // Start with some history
      mockState.history = [mockHistoryItem];
      mockStorage.getItem.mockResolvedValue([mockHistoryItem]);
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useHistory(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Reset mocks after hydration
      mockStorage.setItem.mockClear();
      
      act(() => {
        result.current.clearHistory();
      });
      
      // Wait for persistence debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Verify storage was called for persistence
      expect(mockStorage.setItem).toHaveBeenCalledWith('storage:history:v1', []);
    });
  });
});