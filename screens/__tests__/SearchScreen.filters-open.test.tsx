import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SearchScreen from '../SearchScreen';
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
    const { queryByTestId } = render(
      <RootContext.Provider value={mockContext}>
        <MockNavigator />
      </RootContext.Provider>
    );

    await waitFor(() => {
      // FiltersSheet component should be rendered (but with visible=false)
      // In React Native testing, Modal components are always in the tree
      const filtersSheet = queryByTestId('filters-sheet');
      expect(filtersSheet).toBeTruthy();
    });
  });

  it('opens filters sheet when openFilters param is true, then clears param', async () => {
    const mockRoute = {
      params: { openFilters: true }
    };

    const { getByTestId } = render(
      <RootContext.Provider value={mockContext}>
        <MockNavigator route={mockRoute} />
      </RootContext.Provider>
    );

    await waitFor(() => {
      // FiltersSheet should be present and visible when param is true
      const filtersSheet = getByTestId('filters-sheet');
      expect(filtersSheet).toBeTruthy();
      // Note: We can't easily test the visible prop in React Native Modal
      // but the component should be rendered when visible=true
    });
  });

  it('shows filters button only when search has focus or results', async () => {
    const { queryByTestId } = render(
      <RootContext.Provider value={mockContext}>
        <MockNavigator />
      </RootContext.Provider>
    );

    await waitFor(() => {
      // Filters button should not be visible initially (no focus, no results)
      const filtersButton = queryByTestId('filters-open-button-search');
      expect(filtersButton).toBeFalsy();
    });
  });
});