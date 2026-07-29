import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { SearchScreen } from '../../screens/SearchScreen';
import { RootContext } from '../../context/RootContext';
import { mockInitialState } from '../mocks/mockState';
import { setShowFilter } from '../../context/reducer';

// Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() }),
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
  useBlocked: () => ({ blocked: [] }),
}));

jest.mock('../../hooks/useBlockFavorite', () => ({
  useBlockFavorite: () => ({
    isFavorite: () => false,
    isBlocked: () => false,
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

  it('re-fetches with the new radius when the distance filter changes (#55)', async () => {
    const { getByPlaceholderText, rerender } = render(
      <RootContext.Provider value={{ state: mockInitialState, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    // Commit a search term (no coords/resolver in the mocks → searchApi path).
    fireEvent.changeText(getByPlaceholderText('What are you craving?'), 'pizza');
    mockSearchApi.mockClear();

    // User applies a larger distance in the filter sheet.
    const newState = {
      ...mockInitialState,
      filters: { ...mockInitialState.filters, radiusMeters: 8047 },
    };
    rerender(
      <RootContext.Provider value={{ state: newState, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );

    await waitFor(() => {
      expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 8047);
    });
  });

  it('does not re-fetch on a radius change when there is no active term (#55)', async () => {
    const { rerender } = render(
      <RootContext.Provider value={{ state: mockInitialState, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );
    mockSearchApi.mockClear();
    mockSearchApiWithResolver.mockClear();

    const newState = {
      ...mockInitialState,
      filters: { ...mockInitialState.filters, radiusMeters: 8047 },
    };
    rerender(
      <RootContext.Provider value={{ state: newState, dispatch: mockDispatch }}>
        <SearchScreen />
      </RootContext.Provider>
    );

    // Give any effect a tick to (not) fire.
    await waitFor(() => expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'unused' })));
    expect(mockSearchApi).not.toHaveBeenCalled();
    expect(mockSearchApiWithResolver).not.toHaveBeenCalled();
  });
});
