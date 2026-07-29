import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { RootContext } from '../../context/RootContext';
import { mockInitialState } from '../../__tests__/mocks/mockState';

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

jest.mock('../../hooks/useHistory', () => ({ useHistory: () => ({ addHistoryEntry: jest.fn() }) }));
jest.mock('../../hooks/useBlocked', () => ({ useBlocked: () => ({ blocked: [] }) }));
jest.mock('../../hooks/useCategories', () => ({ __esModule: true, default: () => ({ loadCategories: () => [] }) }));

jest.mock('../../components/RouletteWheel', () => {
  const { Pressable, Text } = require('react-native');
  return {
    RouletteWheel: ({ onSpin }: any) => (
      <Pressable testID="roulette-wheel" onPress={onSpin}>
        <Text>Wheel</Text>
      </Pressable>
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
const withResults = (radiusMeters: number) => ({
  ...mockInitialState,
  results: [{ id: 'a', name: 'Alpha Cafe', categories: [] }] as any,
  filters: { ...mockInitialState.filters, radiusMeters },
});

describe('HomeScreen radius refetch on spin (#55)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('re-issues the search on Spin Again when the radius changed since the last fetch', async () => {
    const { getByPlaceholderText, getByTestId, rerender } = render(
      <RootContext.Provider value={{ state: withResults(1600), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );

    // Perform a real search (records the fetched radius = 1600).
    const input = getByPlaceholderText('What are you craving?');
    fireEvent.changeText(input, 'pizza');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 1600));
    mockSearchApi.mockClear();

    // User widens Distance to 3 mi, then taps Spin Again.
    rerender(
      <RootContext.Provider value={{ state: withResults(4800), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    fireEvent.press(getByTestId('roulette-wheel'));

    await waitFor(() =>
      expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 4800)
    );
  });

  it('does not re-issue the search on spin when the radius is unchanged', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <RootContext.Provider value={{ state: withResults(1600), dispatch: mockDispatch }}>
        <HomeScreen />
      </RootContext.Provider>
    );
    const input = getByPlaceholderText('What are you craving?');
    fireEvent.changeText(input, 'pizza');
    fireEvent(input, 'submitEditing');
    await waitFor(() => expect(mockSearchApi).toHaveBeenCalledWith('pizza', expect.anything(), null, 1600));
    mockSearchApi.mockClear();

    // Spin again without changing the radius → spins the existing set, no refetch.
    fireEvent.press(getByTestId('roulette-wheel'));
    expect(mockSearchApi).not.toHaveBeenCalled();
  });
});
