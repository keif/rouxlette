import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { RootContext } from '../../context/RootContext';
import { mockInitialState } from '../../__tests__/mocks/mockState';
import { setShowFilter } from '../../context/reducer';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() }),
}));

// Mock the data hooks so no network / native access happens
jest.mock('../../hooks/useResults', () => ({
  __esModule: true,
  default: () => ['', { id: '', businesses: [] }, jest.fn(), jest.fn(), false],
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

jest.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ addHistoryEntry: jest.fn() }),
}));

jest.mock('../../hooks/useBlocked', () => ({
  useBlocked: () => ({ blocked: [] }),
}));

jest.mock('../../hooks/useCategories', () => ({
  __esModule: true,
  default: () => ({ loadCategories: () => [] }),
}));

// Stub out the heavy child components. These pull in native-only modules
// (vector icons, reanimated wheel, modal internals) that are irrelevant to
// the header/CTA behaviour we are asserting here.
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
  return {
    ActiveFilterBar: ({ filters }: any) => (
      <View testID="active-filter-bar" accessibilityValue={{ text: String(filters.length) }} />
    ),
  };
});

// The FiltersSheet stub surfaces its `visible` prop so we can assert whether
// the sheet is open, and exposes the filters button that lives in the sheet.
jest.mock('../../components/filter/FiltersSheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible }: any) =>
      visible ? <View testID="filters-sheet" /> : null,
  };
});

// Render the header filter icon with a stable testID derived from its name so
// the test can press it (the product button itself carries no testID).
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const Icon = ({ name }: any) => <Text testID={`icon-${name}`}>{name}</Text>;
  return { Ionicons: Icon, MaterialIcons: Icon, FontAwesome: Icon };
});

jest.mock('../../utils/filterBusinesses', () => ({
  countActiveFilters: jest.fn(() => 0),
  DISTANCE_OPTIONS: [
    { label: '1 mi', meters: 1600 },
    { label: '3 mi', meters: 4800 },
  ],
  getDistanceLabel: jest.fn(() => '1 mi'),
}));

const { countActiveFilters } = require('../../utils/filterBusinesses');

const mockDispatch = jest.fn();

const renderHome = (state = mockInitialState) =>
  render(
    <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
      <HomeScreen />
    </RootContext.Provider>
  );

describe('HomeScreen Filters CTA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (countActiveFilters as jest.Mock).mockReturnValue(0);
  });

  it('renders filters button in header', () => {
    const { getAllByTestId } = renderHome();
    // The header filter button uses the "options-outline" icon.
    expect(getAllByTestId('icon-options-outline').length).toBeGreaterThan(0);
  });

  it('opens filters sheet when the filters CTA is pressed', () => {
    const { getByTestId, queryByTestId } = renderHome();

    // Sheet is closed initially (state.showFilter === false)
    expect(queryByTestId('filters-sheet')).toBeNull();

    // Press the header filters button (its icon is the pressable's only child)
    fireEvent.press(getByTestId('icon-options-outline'));

    // Pressing dispatches setShowFilter(true) rather than mutating local state.
    expect(mockDispatch).toHaveBeenCalledWith(setShowFilter(true));
  });

  it('shows the filters sheet when showFilter is true in state', () => {
    const openState = { ...mockInitialState, showFilter: true };
    const { getByTestId } = renderHome(openState);
    expect(getByTestId('filters-sheet')).toBeTruthy();
  });

  it('shows a filter count badge when filters are active', () => {
    (countActiveFilters as jest.Mock).mockReturnValue(2);

    const stateWithActiveFilters = {
      ...mockInitialState,
      filters: {
        ...mockInitialState.filters,
        priceLevels: [1, 2],
        openNow: true,
      },
    };

    const { getByText } = renderHome(stateWithActiveFilters);
    // Badge renders the active filter count from countActiveFilters().
    expect(getByText('2')).toBeTruthy();
  });

  it('dispatches setShowFilter when the filters CTA is pressed', () => {
    const { getByTestId } = renderHome();
    fireEvent.press(getByTestId('icon-options-outline'));
    expect(mockDispatch).toHaveBeenCalledWith(setShowFilter(true));
  });
});
