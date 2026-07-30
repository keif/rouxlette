import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { SearchScreen } from '../../screens/SearchScreen';
import { RootContext } from '../../context/RootContext';
import { mockInitialState } from '../mocks/mockState';
import { setShowFilter, setLastSearch } from '../../context/reducer';

// Navigation
let mockIsFocused = true; // prefixed `mock` so the jest.mock factory may use it
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => mockIsFocused,
}));

// Data hooks. SearchScreen destructures 5 values from useResults and 10 from
// useLocation; return correctly-shaped tuples so nothing resolves to undefined.
// Stable spies (prefixed `mock` so the jest.mock factory may reference them)
// let us assert searchApi calls across re-renders (#55 re-search on radius).
const mockSearchApi = jest.fn(async () => []);
const mockSearchApiWithResolver = jest.fn(async () => []);
jest.mock('../../hooks/useResults', () => ({
  __esModule: true,
  default: () => ['', { id: '', businesses: [] }, mockSearchApi, mockSearchApiWithResolver, false],
  INIT_RESULTS: { id: '', businesses: [] },
}));

jest.mock('../../hooks/useLocation', () => ({
  __esModule: true,
  default: () => [
    '',
    'Columbus, OH',
    'Columbus, OH',
    null,
    jest.fn(),
    jest.fn(),
    jest.fn(),
    false,
    jest.fn(),
    jest.fn(),
  ],
}));

jest.mock('../../hooks/useBlocked', () => ({
  useBlocked: jest.fn(() => ({ blocked: [] })),
}));
// Spy so we can assert Search hydrates the blocked list on its own (deep-link entry).
const { useBlocked: mockUseBlocked } = require('../../hooks/useBlocked');

// useDealbreakers hits persistent storage; stub it so screen tests don't touch
// AsyncStorage. It's mounted purely for its hydrate/persist side effect here.
jest.mock('../../hooks/useDealbreakers', () => ({
  useDealbreakers: () => ({ dealbreakers: [] }),
}));

// Configurable favorite/blocked sets (prefixed `mock` for the jest factory).
const mockFavoriteIds = new Set<string>();
const mockBlockedIds = new Set<string>();
jest.mock('../../hooks/useBlockFavorite', () => ({
  useBlockFavorite: () => ({
    isFavorite: (id: string) => mockFavoriteIds.has(id),
    isBlocked: (id: string) => mockBlockedIds.has(id),
    handleFavorite: jest.fn(),
    handleBlock: jest.fn(),
  }),
}));

// Stub heavy child components that pull in native-only modules.
jest.mock('../../components/RestaurantCardSimple', () => {
  const { View, Text } = require('react-native');
  return {
    RestaurantCardSimple: ({ restaurant }: any) => (
      <View testID={`restaurant-card-${restaurant.id}`}>
        <Text>{restaurant.name}</Text>
      </View>
    ),
  };
});

jest.mock('../../components/ActiveFilterBar', () => {
  const { View } = require('react-native');
  return {
    ActiveFilterBar: () => <View testID="active-filter-bar" />,
  };
});

jest.mock('../../components/filter/FiltersSheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible }: any) => (visible ? <View testID="filters-sheet" /> : null),
  };
});

// Render icons with a stable testID derived from name so we can drive the
// header controls (the product Pressables carry no testID of their own).
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const Icon = ({ name }: any) => <Text testID={`icon-${name}`}>{name}</Text>;
  return { Ionicons: Icon, MaterialIcons: Icon, FontAwesome: Icon };
});

jest.mock('../../utils/filterBusinesses', () => ({
  applyFilters: (results: any[]) => results,
  countActiveFilters: jest.fn(() => 0),
}));

const mockDispatch = jest.fn();

const renderSearch = (state = mockInitialState) =>
  render(
    <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
      <SearchScreen />
    </RootContext.Provider>
  );

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused = true;
    mockFavoriteIds.clear();
    mockBlockedIds.clear();
  });

  it('hydrates the blocked list on mount (deep-link entry safety)', () => {
    renderSearch();
    expect(mockUseBlocked).toHaveBeenCalled();
  });

  it('renders the empty state prompt when there are no results', () => {
    const { getByText } = renderSearch();
    expect(getByText('Search for restaurants')).toBeTruthy();
  });

  it('renders the search input placeholder', () => {
    const { getByPlaceholderText } = renderSearch();
    expect(getByPlaceholderText('What are you craving?')).toBeTruthy();
  });

  it('dispatches setShowFilter(true) when the filters button is pressed', () => {
    const { getByTestId } = renderSearch();
    fireEvent.press(getByTestId('icon-options-outline'));
    expect(mockDispatch).toHaveBeenCalledWith(setShowFilter(true));
  });

  it('shows the favorites chip and folds the blocked count into the Avoiding bar', () => {
    mockFavoriteIds.add('a');   // Alpha is favorited (in the visible list)
    mockBlockedIds.add('c');    // Gamma is blocked (only in rawResults)
    const state = {
      ...mockInitialState,
      results: [
        { id: 'a', name: 'Alpha Cafe', categories: [] },
        { id: 'b', name: 'Beta Bistro', categories: [] },
      ] as any,
      rawResults: [
        { id: 'a', name: 'Alpha Cafe', categories: [] },
        { id: 'b', name: 'Beta Bistro', categories: [] },
        { id: 'c', name: 'Gamma Grill', categories: [] },
      ] as any,
    };
    const { getByText, getByTestId } = render(
      <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    expect(getByText('1 favorite')).toBeTruthy();
    // The standalone "N blocked hidden" summary is gone; the count now lives in
    // the Avoiding bar (rendered because blockedCount > 0).
    const bar = getByTestId('avoiding-bar');
    expect(within(bar).getByText(/1 blocked/)).toBeTruthy();
  });

  it('shows the Avoiding bar when there are dealbreakers', () => {
    const state = {
      ...mockInitialState,
      dealbreakerCategoryIds: ['sushi'],
      results: [{ id: 'a', name: 'Alpha', categories: [] }] as any,
      rawResults: [{ id: 'a', name: 'Alpha', categories: [] }] as any,
    };
    const { getByTestId } = render(
      <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    expect(getByTestId('avoiding-bar')).toBeTruthy();
  });

  it('surfaces an all-avoided empty state (with a tappable Avoiding bar) when dealbreakers hide every match', () => {
    // The reducer already dropped the sushi place from results (dealbreaker),
    // but rawResults still holds it — the user searched and got matches, then
    // their "Never show me" settings hid them all.
    const state = {
      ...mockInitialState,
      dealbreakerCategoryIds: ['sushi'],
      results: [] as any,
      rawResults: [{ id: 's', name: 'Sushi Spot', categories: [{ alias: 'sushi', title: 'Sushi' }] }] as any,
    };
    const { getByTestId } = render(
      <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    expect(getByTestId('all-avoided-empty')).toBeTruthy();
    // The bar is present so the user can tap to adjust their exclusions.
    expect(getByTestId('avoiding-bar')).toBeTruthy();
  });

  it('shows an all-blocked empty state when every match is blocked', () => {
    mockBlockedIds.add('a');
    mockBlockedIds.add('b');
    const state = {
      ...mockInitialState,
      results: [] as any, // reducer already excluded the blocked matches
      rawResults: [
        { id: 'a', name: 'Alpha Cafe', categories: [] },
        { id: 'b', name: 'Beta Bistro', categories: [] },
      ] as any,
    };
    const { getByTestId, queryByText } = render(
      <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    expect(getByTestId('all-blocked-empty')).toBeTruthy();
    expect(queryByText('Search for restaurants')).toBeNull();
  });

  it('renders a card for each result', () => {
    const state = {
      ...mockInitialState,
      results: [
        { id: 'a', name: 'Alpha Cafe', categories: [] },
        { id: 'b', name: 'Beta Bistro', categories: [] },
      ] as any,
    };
    const { getByTestId } = renderSearch(state);
    expect(getByTestId('restaurant-card-a')).toBeTruthy();
    expect(getByTestId('restaurant-card-b')).toBeTruthy();
  });

  it('makes the actual spun winner the "wheel picked" hero, not the first result', () => {
    const state = {
      ...mockInitialState,
      results: [
        { id: 'a', name: 'Alpha Cafe', categories: [] },
        { id: 'b', name: 'Beta Bistro', categories: [] },
      ] as any,
      // The wheel landed on B, which is NOT the first result.
      spinHistory: [
        { restaurant: { id: 'b', name: 'Beta Bistro', categories: [] }, timestamp: 1 },
      ] as any,
    };
    const { getByTestId } = renderSearch(state);
    // The hero card carries the wheel badge + the hero-only "Spin again" action,
    // and it must be the winner (B), not the first result (A).
    const heroB = getByTestId('restaurant-card-b');
    expect(within(heroB).getByText(/The wheel picked/)).toBeTruthy();
    expect(within(heroB).getByText(/Spin again/)).toBeTruthy();
    // A is a plain row — no hero-only action.
    expect(within(getByTestId('restaurant-card-a')).queryByText(/Spin again/)).toBeNull();
  });

  it('does not claim "wheel picked" when there was no spin this session', () => {
    const state = {
      ...mockInitialState,
      results: [{ id: 'a', name: 'Alpha Cafe', categories: [] }] as any,
      spinHistory: [] as any,
    };
    const { queryByText, getByText } = renderSearch(state);
    expect(queryByText(/The wheel picked/)).toBeNull();
    expect(getByText('Top result')).toBeTruthy();
  });

  it('ignores a stale spin winner not present in the current results', () => {
    const state = {
      ...mockInitialState,
      results: [
        { id: 'a', name: 'Alpha Cafe', categories: [] },
        { id: 'b', name: 'Beta Bistro', categories: [] },
      ] as any,
      // A prior spin from a different result set — its winner isn't in these results.
      spinHistory: [
        { restaurant: { id: 'z', name: 'Zeta Diner', categories: [] }, timestamp: 1 },
      ] as any,
    };
    const { queryByText, getByText, getByTestId } = renderSearch(state);
    // No stale "wheel picked" badge; hero falls back to the top result (A).
    expect(queryByText(/The wheel picked/)).toBeNull();
    expect(getByText('Top result')).toBeTruthy();
    expect(within(getByTestId('restaurant-card-a')).getByText(/Spin again/)).toBeTruthy();
  });

  // Committed search identity lives in shared state (state.lastSearch); the
  // reconciliation reads it so radius changes reconcile across screens (#58).
  const committedState = (term: string, committedRadius: number, filterRadius: number) => ({
    ...mockInitialState,
    lastSearch: { term, coords: null, radiusMeters: committedRadius },
    filters: { ...mockInitialState.filters, radiusMeters: filterRadius },
  });

  it('records the committed search identity when a search is submitted (#58)', async () => {
    const { getByPlaceholderText } = render(
      <RootContext.Provider value={{ state: mockInitialState, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    const input = getByPlaceholderText('What are you craving?');
    fireEvent.changeText(input, 'pizza');
    fireEvent(input, 'submitEditing');
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(
        setLastSearch({ term: 'pizza', coords: null, radiusMeters: 1600 })
      )
    );
  });

  it('clears the committed search when a search fails (#58)', async () => {
    mockSearchApi.mockRejectedValueOnce(new Error('network'));
    const { getByPlaceholderText } = render(
      <RootContext.Provider value={{ state: mockInitialState, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    const input = getByPlaceholderText('What are you craving?');
    fireEvent.changeText(input, 'pizza');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(setLastSearch(null)));
  });

  it('auto-refetches the committed term when the applied radius diverges — even from another screen (#55/#58)', async () => {
    // Mounts already stale: results committed at 1600 m, filter now at 8047 m
    // (e.g. arriving from Home's "View all" with a wider distance applied).
    render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 8047), dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    await waitFor(() =>
      expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 8047)
    );
  });

  it('does not auto-refetch in the background when the Search tab is blurred (#58)', async () => {
    // Tab navigators keep Search mounted after blur; a distance change made on
    // Home must not trigger a background refetch here.
    mockIsFocused = false;
    render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 8047), dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    // Let any effect settle, then assert no refetch happened.
    await waitFor(() => expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'unused' })));
    expect(mockSearchApi).not.toHaveBeenCalled();
    expect(mockSearchApiWithResolver).not.toHaveBeenCalled();
  });

  it('replays the committed term on a radius refetch, not the draft input (#55/#58)', async () => {
    const { getByPlaceholderText, rerender } = render(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 1600), dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    // Edit the box to an UNsubmitted draft, then change the radius.
    fireEvent.changeText(getByPlaceholderText('What are you craving?'), 'sushi');
    mockSearchApi.mockClear();
    rerender(
      <RootContext.Provider value={{ state: committedState('pizza', 1600, 8047), dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    await waitFor(() =>
      expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 8047)
    );
    expect(mockSearchApi).not.toHaveBeenCalledWith('sushi', expect.anything(), null, 8047);
  });

  it('does not refetch when there is no committed search or the radius matches (#58)', async () => {
    // No committed search yet.
    const { rerender } = render(
      <RootContext.Provider value={{ state: { ...mockInitialState, filters: { ...mockInitialState.filters, radiusMeters: 8047 } }, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    expect(mockSearchApi).not.toHaveBeenCalled();
    expect(mockSearchApiWithResolver).not.toHaveBeenCalled();

    // Committed, but radius already matches → still no refetch.
    rerender(
      <RootContext.Provider value={{ state: committedState('pizza', 8047, 8047), dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    expect(mockSearchApi).not.toHaveBeenCalled();
  });
});
