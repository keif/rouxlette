import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SearchScreen } from '../SearchScreen';
import { RootContext } from '../../context/RootContext';
import { mockInitialState } from '../../__tests__/mocks/mockState';

// Mock the dependencies
jest.mock('../../hooks/useResults', () => ({
  __esModule: true,
  default: () => ['', { id: '', businesses: [] }, jest.fn()],
  INIT_RESULTS: { id: '', businesses: [] },
}));

jest.mock('../../hooks/useLocation', () => ({
  __esModule: true,
  default: () => ['', '', null, [], jest.fn(), false],
}));

jest.mock('../../hooks/useFiltersPersistence', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../hooks/useBlocked', () => ({
  __esModule: true,
  useBlocked: () => ({ blocked: [] }),
}));

// useDealbreakers touches persistent storage; stub it (mounted for its side effect).
jest.mock('../../hooks/useDealbreakers', () => ({
  __esModule: true,
  useDealbreakers: () => ({ dealbreakers: [] }),
}));

jest.mock('../../hooks/useBlockFavorite', () => ({
  __esModule: true,
  useBlockFavorite: () => ({
    isFavorite: jest.fn(() => false),
    isBlocked: jest.fn(() => false),
    handleFavorite: jest.fn(),
    handleBlock: jest.fn(),
  }),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('@miblanchard/react-native-slider', () => ({
  Slider: 'Slider'
}));

jest.mock('../../utils/filterBusinesses', () => ({
  applyFilters: jest.fn((businesses) => businesses),
  countActiveFilters: jest.fn(() => 0),
  DISTANCE_OPTIONS: [
    { label: '1 mi', meters: 1600 },
    { label: '3 mi', meters: 4800 },
  ],
  getDistanceLabel: jest.fn(() => '1 mi'),
}));

const Tab = createMaterialTopTabNavigator();

const MockNavigator = ({ route }: { route?: any }) => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          initialParams={route?.params}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const mockContext = {
  state: mockInitialState,
  dispatch: jest.fn(),
};

describe('SearchScreen Filters Modal Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Search screen without auto-opening filters when no param provided', async () => {
    const { queryByText } = render(
      <RootContext.Provider value={mockContext}>
        <MockNavigator />
      </RootContext.Provider>
    );

    await waitFor(() => {
      // Screen renders its empty-state prompt when there are no results.
      expect(queryByText('Search for restaurants')).toBeTruthy();
      // The FiltersSheet is a Modal driven by state.showFilter, which starts
      // false, so its content ("Filters" header) is not rendered/visible.
      expect(queryByText('Filters')).toBeNull();
    });
  });

  it('does not open the filters sheet from route params (no auto-open behavior)', async () => {
    // The current SearchScreen does not read an `openFilters` route param;
    // the sheet is controlled solely by state.showFilter. Passing the param
    // should therefore leave the sheet closed.
    const mockRoute = {
      params: { openFilters: true }
    };

    const { queryByText } = render(
      <RootContext.Provider value={mockContext}>
        <MockNavigator route={mockRoute} />
      </RootContext.Provider>
    );

    await waitFor(() => {
      expect(queryByText('Search for restaurants')).toBeTruthy();
      // showFilter is false in mock state, so the sheet content stays hidden.
      expect(queryByText('Filters')).toBeNull();
    });
  });

  it('opens the filters sheet when state.showFilter is true', async () => {
    const openContext = {
      state: { ...mockInitialState, showFilter: true },
      dispatch: jest.fn(),
    };

    const { queryByText } = render(
      <RootContext.Provider value={openContext}>
        <MockNavigator />
      </RootContext.Provider>
    );

    await waitFor(() => {
      // With showFilter=true the Modal is visible and renders the sheet header.
      expect(queryByText('Filters')).toBeTruthy();
    });
  });
});
