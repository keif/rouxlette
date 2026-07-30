/**
 * Tests for useDealbreakers hook to ensure the persisted dealbreaker
 * category aliases are hydrated into global state on mount. Mirrors the
 * mocking conventions used by the other persistence-hook tests (storage
 * hook + logging utility mocked at the module level).
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useDealbreakers } from '../../hooks/useDealbreakers';
import { RootContext } from '../../context/RootContext';
import { initialAppState } from '../../context/state';
import { hydrateDealbreakers } from '../../context/reducer';

// Mock storage (same shape as usePersistentStorage's public API)
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

function Harness() {
  useDealbreakers();
  return null;
}

describe('useDealbreakers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(['sushi']);
    mockStorage.setItem.mockResolvedValue(undefined);
  });

  it('hydrates the persisted dealbreakers on mount', async () => {
    const dispatch = jest.fn();

    render(
      <RootContext.Provider value={{ state: { ...initialAppState }, dispatch }}>
        <Harness />
      </RootContext.Provider>
    );

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(hydrateDealbreakers(['sushi']))
    );
  });
});
