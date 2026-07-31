/**
 * Tests for usePersistentStorage teardown behavior.
 *
 * A value written just before the hook unmounts is still sitting in the debounce
 * window. It must be flushed (persisted) on unmount rather than dropped, and the
 * pending timer must be cleared so it cannot fire after teardown (the source of
 * Jest's "worker process failed to exit gracefully" warning).
 */

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usePersistentStorage from '../usePersistentStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../utils/log', () => ({
  logSafe: jest.fn(),
  safeStringify: (value: unknown) => JSON.stringify(value),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

(global as any).__DEV__ = true;

describe('usePersistentStorage teardown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('flushes a pending debounced write when the hook unmounts', async () => {
    const { result, unmount } = renderHook(() => usePersistentStorage());

    await act(async () => {
      result.current.markAsHydrated('favorites');
      await result.current.setItem('favorites', ['pizza-place']);
    });

    // Still inside the debounce window — nothing persisted yet.
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();

    // Unmount must flush the pending value, not drop it.
    act(() => {
      unmount();
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      '@roux:favorites',
      JSON.stringify(['pizza-place'])
    );

    // The pending timer must have been cleared on unmount, not merely fired:
    // advancing time must not trigger a second, post-teardown write.
    mockAsyncStorage.setItem.mockClear();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
