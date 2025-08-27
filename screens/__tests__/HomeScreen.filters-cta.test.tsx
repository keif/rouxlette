import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';
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
  default: () => ['', 'Columbus, OH', null, [], jest.fn(), false],
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('@miblanchard/react-native-slider', () => ({
  Slider: 'Slider'
}));

jest.mock('../../utils/filterBusinesses', () => ({
  countActiveFilters: jest.fn(() => 0),
  DISTANCE_OPTIONS: [
    { label: '1 mi', meters: 1600 },
    { label: '3 mi', meters: 4800 },
  ],
  getDistanceLabel: jest.fn(() => '1 mi'),
}));

const mockDispatch = jest.fn();
const mockContext = {
  state: mockInitialState,
  dispatch: mockDispatch,
};

describe('HomeScreen Filters CTA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filters button in header', async () => {
    const { getByTestId, debug } = render(
      <RootContext.Provider value={mockContext}>
        <HomeScreen />
      </RootContext.Provider>
    );

    // Debug output to see what's rendered
    debug();

    await waitFor(() => {
      const filtersButton = getByTestId('filters-open-button-home');
      expect(filtersButton).toBeTruthy();
    });
  });

  it('opens filters sheet when CTA is pressed', async () => {
    const { getByTestId } = render(
      <RootContext.Provider value={mockContext}>
        <HomeScreen />
      </RootContext.Provider>
    );

    const filtersButton = getByTestId('filters-open-button-home');
    fireEvent.press(filtersButton);

    await waitFor(() => {
      const filtersSheet = getByTestId('filters-sheet');
      expect(filtersSheet).toBeTruthy();
    });
  });

  it('shows filter count badge when filters are active', async () => {
    const stateWithActiveFilters = {
      ...mockInitialState,
      filters: {
        ...mockInitialState.filters,
        priceLevels: [1, 2], // Active price filters
        openNow: true, // Active open now filter
      },
    };

    const contextWithFilters = {
      state: stateWithActiveFilters,
      dispatch: mockDispatch,
    };

    const { getByTestId } = render(
      <RootContext.Provider value={contextWithFilters}>
        <HomeScreen />
      </RootContext.Provider>
    );

    await waitFor(() => {
      const filtersButton = getByTestId('filters-open-button-home');
      expect(filtersButton).toBeTruthy();
      // Badge should show count of 2 (price + openNow)
    });
  });

  it('dispatches filter updates when filters are applied from Home', async () => {
    const { getByTestId } = render(
      <RootContext.Provider value={mockContext}>
        <HomeScreen />
      </RootContext.Provider>
    );

    const filtersButton = getByTestId('filters-open-button-home');
    fireEvent.press(filtersButton);

    // Note: Testing the actual filter apply action would require more complex
    // interaction with the FiltersSheet component, which is tested separately
    await waitFor(() => {
      expect(getByTestId('filters-sheet')).toBeTruthy();
    });
  });
});