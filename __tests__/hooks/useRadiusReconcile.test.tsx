import React from 'react';
import { render, act } from '@testing-library/react-native';
import { RootContext } from '../../context/RootContext';
import { useRadiusReconcile } from '../../hooks/useRadiusReconcile';
import { initialAppState } from '../../context/state';

let capturedReconcile: () => boolean;

function Harness({ isSearching, autoWhenIdle, runSearch }: any) {
  const { reconcile } = useRadiusReconcile({ isSearching, runSearch, autoWhenIdle });
  capturedReconcile = reconcile;
  return null;
}

const stateWith = (lastSearch: any, radiusMeters = 1600) => ({
  ...initialAppState,
  filters: { ...initialAppState.filters, radiusMeters },
  lastSearch,
});

const renderHarness = (state: any, props: any) =>
  render(
    <RootContext.Provider value={{ state, dispatch: jest.fn() }}>
      <Harness {...props} />
    </RootContext.Provider>
  );

describe('useRadiusReconcile (#58)', () => {
  const committed = { term: 'pizza', coords: null, radiusMeters: 1600 };

  it('auto-refetches the committed term when idle and the radius diverges', () => {
    const runSearch = jest.fn();
    renderHarness(stateWith(committed, 8047), { isSearching: false, autoWhenIdle: true, runSearch });
    expect(runSearch).toHaveBeenCalledWith('pizza');
  });

  it('does not auto-refetch when idle if autoWhenIdle is false, but reconcile() does', () => {
    const runSearch = jest.fn();
    renderHarness(stateWith(committed, 8047), { isSearching: false, autoWhenIdle: false, runSearch });
    expect(runSearch).not.toHaveBeenCalled();
    act(() => { capturedReconcile(); });
    expect(runSearch).toHaveBeenCalledWith('pizza');
  });

  it('does nothing when the applied radius already matches the committed one', () => {
    const runSearch = jest.fn();
    renderHarness(stateWith(committed, 1600), { isSearching: false, autoWhenIdle: true, runSearch });
    expect(runSearch).not.toHaveBeenCalled();
  });

  it('does nothing when there is no committed search yet', () => {
    const runSearch = jest.fn();
    renderHarness(stateWith(null, 8047), { isSearching: false, autoWhenIdle: true, runSearch });
    expect(runSearch).not.toHaveBeenCalled();
  });

  it('reconciles after an in-flight search settles even when autoWhenIdle is false', () => {
    const runSearch = jest.fn();
    const { rerender } = renderHarness(stateWith(committed, 8047), {
      isSearching: true,
      autoWhenIdle: false,
      runSearch,
    });
    expect(runSearch).not.toHaveBeenCalled(); // in flight → wait

    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={false} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledWith('pizza');
  });
});
