import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { RootContext } from '../../context/RootContext';
import { mockInitialState } from '../../__tests__/mocks/mockState';
import { setLastSearch } from '../../context/reducer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() }),
}));

// Stable spies (prefixed `mock` so the factory may reference them) let us assert
// that "Spin Again" re-issues the Yelp search after a radius change (#55).
const mockSearchApi = jest.fn(async () => []);
const mockSearchApiWithResolver = jest.fn(async () => []);
jest.mock('../../hooks/useResults', () => ({
  __esModule: true,
  default: () => ['', { id: '', businesses: [] }, mockSearchApi, mockSearchApiWithResolver, false],
  INIT_RESULTS: { id: '', businesses: [] },
}));

jest.mock('../../hooks/useLocation', () => ({
  __esModule: true,
  default: () => ['', 'Columbus, OH', 'Columbus, OH', null, jest.fn(), jest.fn(), jest.fn(), false, jest.fn(), jest.fn()],
}));

const mockAddHistoryEntry = jest.fn();
jest.mock('../../hooks/useHistory', () => ({ useHistory: () => ({ addHistoryEntry: mockAddHistoryEntry }) }));
jest.mock('../../hooks/useBlocked', () => ({ useBlocked: () => ({ blocked: [] }) }));
// useDealbreakers touches persistent storage; stub it (mounted for its side effect).
jest.mock('../../hooks/useDealbreakers', () => ({ useDealbreakers: () => ({ dealbreakers: [] }) }));
jest.mock('../../hooks/useCategories', () => ({ __esModule: true, default: () => ({ loadCategories: () => [] }) }));

jest.mock('../../components/RouletteWheel', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    RouletteWheel: ({ onSpin, onAutoSpinComplete }: any) => (
      <View>
        <Pressable testID="roulette-wheel" onPress={onSpin}>
          <Text>Wheel</Text>
        </Pressable>
        <Pressable testID="wheel-complete" onPress={onAutoSpinComplete}>
          <Text>Done</Text>
        </Pressable>
      </View>
    ),
  };
});
jest.mock('../../components/ActiveFilterBar', () => {
  const { View } = require('react-native');
  return { ActiveFilterBar: () => <View testID="active-filter-bar" /> };
});
jest.mock('../../components/filter/FiltersSheet', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: ({ visible }: any) => (visible ? <View testID="filters-sheet" /> : null) };
});
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const Icon = ({ name }: any) => <Text testID={`icon-${name}`}>{name}</Text>;
  return { Ionicons: Icon, MaterialIcons: Icon, FontAwesome: Icon };
});
jest.mock('../../utils/filterBusinesses', () => ({
  countActiveFilters: jest.fn(() => 0),
  applyFilters: (results: any[]) => results,
  DISTANCE_OPTIONS: [{ label: '1 mi', meters: 1600 }],
  getDistanceLabel: jest.fn(() => '1 mi'),
}));

const mockDispatch = jest.fn();
// Committed search identity lives in shared state (#58). Results present so
// hasResults is true and Spin Again exercises the reconcile path.
const committedState = (term: string, committedRadius: number, filterRadius: number) => ({
  ...mockInitialState,
  results: [{ id: 'a', name: 'Alpha Cafe', categories: [] }] as any,
  lastSearch: { term, coords: null, radiusMeters: committedRadius },
  filters: { ...mockInitialState.filters, radiusMeters: filterRadius },
});

describe('HomeScreen radius refetch on spin (#55/#58)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records the committed identity when a Home search is submitted', async () => {
    const { getByPlaceholderText } = render(
      <RootContext.Provider value={{ state: mockInitialState, dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    const input = getByPlaceholderText('What are you craving?');
    fireEvent.changeText(input, 'pizza');
    fireEvent(input, 'submitEditing');
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(setLastSearch({ term: 'pizza', coords: null, radiusMeters: 1600 }))
    );
  });

  it('clears the committed search when a Home search fails (#58)', async () => {
    mockSearchApi.mockRejectedValueOnce(new Error('network'));
    const { getByPlaceholderText } = render(
      <RootContext.Provider value={{ state: mockInitialState, dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    const input = getByPlaceholderText('What are you craving?');
    fireEvent.changeText(input, 'pizza');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(setLastSearch(null)));
  });

  it('re-issues the committed search on Spin Again when the radius changed', async () => {
    // Committed at 1 mi, filter now at 3 mi → stale. Tap the wheel.
    const { getByTestId } = render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 4800), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    fireEvent.press(getByTestId('roulette-wheel'));
    await waitFor(() =>
      expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 4800)
    );
  });

  it('does not re-issue the search on spin when the radius is unchanged', () => {
    const { getByTestId } = render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 1600), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    // Spin with matching radius → spins the existing set, no refetch.
    fireEvent.press(getByTestId('roulette-wheel'));
    expect(mockSearchApi).not.toHaveBeenCalled();
  });

  it('records the committed term in spin history, not a blank/draft input box (#58)', () => {
    // Committed 'pizza' (e.g. from another screen), Home's input box left blank,
    // radius not stale so the spin uses the existing results.
    const { getByTestId } = render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 1600), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    fireEvent.press(getByTestId('roulette-wheel'));   // spin → selectedResult set
    fireEvent.press(getByTestId('wheel-complete'));   // completion → history recorded

    expect(mockAddHistoryEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({ searchTerm: 'pizza' }),
      })
    );
  });

  it('re-spins the wheel when the winner modal requests a spin (spinRequestId bump)', () => {
    const base = committedState('pizza', 1600, 1600); // has results, radius matches
    const { queryAllByText, getAllByText, rerender } = render(
      <RootContext.Provider value={{ state: base, dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    expect(queryAllByText('Spinning...').length).toBe(0); // idle before the request
    // The modal's Spin Again bumps spinRequestId; Home should start the wheel.
    rerender(
      <RootContext.Provider value={{ state: { ...base, spinRequestId: base.spinRequestId + 1 }, dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    expect(getAllByText('Spinning...').length).toBeGreaterThan(0);
  });

  it('does not auto-refetch on an idle radius change (no surprise spin)', () => {
    // Stale committed radius but the user has NOT spun — Home must stay put.
    render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 4800), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    expect(mockSearchApi).not.toHaveBeenCalled();
    expect(mockSearchApiWithResolver).not.toHaveBeenCalled();
  });
});
