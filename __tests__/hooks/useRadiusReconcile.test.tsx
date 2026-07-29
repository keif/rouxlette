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

  it('does not retry the same radius after a failed reconcile (no infinite loop)', () => {
    const runSearch = jest.fn();
    // Idle + stale → attempts once.
    const { rerender } = renderHarness(stateWith(committed, 8047), {
      isSearching: false,
      autoWhenIdle: true,
      runSearch,
    });
    expect(runSearch).toHaveBeenCalledTimes(1);

    // Simulate a FAILED search cycle: isSearching flips true→false but the
    // failure left `lastSearch` unchanged (still stale at 8047).
    const stale = () => (
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={true} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    rerender(stale());
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    // Must NOT retry the same (failed) radius.
    expect(runSearch).toHaveBeenCalledTimes(1);

    // But a change to a NEW radius attempts again.
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 5000), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledTimes(2);
  });

  it('re-attempts a radius that failed once, after returning to the committed radius (#58)', () => {
    const runSearch = jest.fn();
    // Committed at 1600. Diverge to 8047 → one attempt (fails: lastSearch stays 1600).
    const { rerender } = renderHarness(stateWith(committed, 8047), {
      isSearching: false,
      autoWhenIdle: true,
      runSearch,
    });
    expect(runSearch).toHaveBeenCalledTimes(1);

    // Back to the committed radius → no longer stale, no attempt (and the guard clears).
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 1600), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledTimes(1);

    // Select the same radius again → must attempt afresh (was permanently blocked).
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledTimes(2);
  });

  it('reconciles when the committed search lands from another screen (external lastSearch update)', () => {
    const runSearch = jest.fn();
    // Focused, filter at 8047, nothing committed yet → no refetch.
    const { rerender } = renderHarness(stateWith(null, 8047), {
      isSearching: false,
      autoWhenIdle: true,
      runSearch,
    });
    expect(runSearch).not.toHaveBeenCalled();

    // A Home search completes and commits at 1600 (radius/focus/isSearching all
    // unchanged) — the effect must still run because lastSearch changed.
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledWith('pizza');
  });

  it('reconciles a pending radius when autoWhenIdle flips to true (regaining focus)', () => {
    const runSearch = jest.fn();
    // Blurred (autoWhenIdle false) with a stale radius → no background refetch.
    const { rerender } = renderHarness(stateWith(committed, 8047), {
      isSearching: false,
      autoWhenIdle: false,
      runSearch,
    });
    expect(runSearch).not.toHaveBeenCalled();

    // Regain focus (autoWhenIdle true) → reconcile the change made while away.
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledWith('pizza');
  });

  it('does NOT auto-reconcile on settle when autoWhenIdle is false (Home / blurred)', () => {
    // A mid-flight radius change must not trigger a background refetch or a
    // surprise re-spin when the caller has opted out of idle auto-reconcile.
    const runSearch = jest.fn();
    const { rerender } = renderHarness(stateWith(committed, 8047), {
      isSearching: true,
      autoWhenIdle: false,
      runSearch,
    });
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={false} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).not.toHaveBeenCalled();
  });

  it('reconciles on settle when autoWhenIdle is true (focused browse, mid-flight change)', () => {
    const runSearch = jest.fn();
    const { rerender } = renderHarness(stateWith(committed, 8047), {
      isSearching: true,
      autoWhenIdle: true,
      runSearch,
    });
    expect(runSearch).not.toHaveBeenCalled(); // in flight → wait
    rerender(
      <RootContext.Provider value={{ state: stateWith(committed, 8047), dispatch: jest.fn() }}>
        <Harness isSearching={false} autoWhenIdle={true} runSearch={runSearch} />
      </RootContext.Provider>
    );
    expect(runSearch).toHaveBeenCalledWith('pizza');
  });
});
