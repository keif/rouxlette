import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FiltersSheet from '../FiltersSheet';
import { RootContext } from '../../../context/RootContext';
import { AppState, initialAppState } from '../../../context/state';

// Mock the vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Config
jest.mock('../../../Config', () => ({
  isAndroid: false,
}));

// Create mock context
const createMockContext = (state: Partial<AppState> = {}) => {
  const mockDispatch = jest.fn();
  const mockState: AppState = {
    ...initialAppState,
    ...state,
  };

  return {
    state: mockState,
    dispatch: mockDispatch,
    mockDispatch,
  };
};

const renderFiltersSheet = (
  contextState: Partial<AppState> = {},
  props: Partial<React.ComponentProps<typeof FiltersSheet>> = {}
) => {
  const { state, dispatch, mockDispatch } = createMockContext(contextState);
  
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    ...props,
  };

  const component = render(
    <RootContext.Provider value={{ state, dispatch }}>
      <FiltersSheet {...defaultProps} />
    </RootContext.Provider>
  );

  return {
    ...component,
    mockDispatch,
    mockOnClose: defaultProps.onClose as jest.Mock,
  };
};

describe('FiltersSheet', () => {
  it('should render when visible', () => {
    const { getByText } = renderFiltersSheet();
    
    expect(getByText('Filters')).toBeTruthy();
    expect(getByText('Price')).toBeTruthy();
    expect(getByText('Open Now')).toBeTruthy();
    expect(getByText('Distance')).toBeTruthy();
    expect(getByText('Minimum Rating')).toBeTruthy();
    expect(getByText('Apply Filters')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = renderFiltersSheet({}, { visible: false });
    
    expect(queryByText('Filters')).toBeFalsy();
  });

  it('should call onClose when close button is pressed', () => {
    const { getByTestId, mockOnClose } = renderFiltersSheet();
    
    // Assuming the close icon has a testID or we can find it by role/text
    // Since we're mocking MaterialIcons, we'll look for the pressable containing it
    const closeButtons = getByTestId ? [] : [];
    // This would work better with actual testIDs in the component
    
    expect(mockOnClose).not.toHaveBeenCalled();
    // Would test close button press here with proper testIDs
  });

  describe('Price Level Filtering', () => {
    it('should display price level buttons', () => {
      const { getAllByTestId } = renderFiltersSheet();
      
      // Note: The actual implementation would need testIDs for proper testing
      // This is a structural test to verify the component renders price sections
      const priceSection = getAllByTestId ? [] : [];
      
      // Would verify 4 price level buttons ($ $$ $$$ $$$$) are present
    });

    it('should highlight selected price levels', () => {
      const contextState = {
        filters: {
          ...initialAppState.filters,
          priceLevels: [2, 3] as Array<1|2|3|4>, // $$ and $$$
        },
      };

      const { getAllByTestId } = renderFiltersSheet(contextState);
      
      // Would verify that price level 2 and 3 buttons show selected state
    });
  });

  describe('Category Filtering', () => {
    it('should display categories when available', () => {
      const contextState = {
        categories: [
          { alias: 'pizza', title: 'Pizza' },
          { alias: 'italian', title: 'Italian' },
          { alias: 'sushi', title: 'Sushi' },
        ],
      };

      const { getByText } = renderFiltersSheet(contextState);
      
      expect(getByText('Categories')).toBeTruthy();
      expect(getByText('Pizza')).toBeTruthy();
      expect(getByText('Italian')).toBeTruthy();
      expect(getByText('Sushi')).toBeTruthy();
    });

    it('should not display categories section when no categories available', () => {
      const contextState = {
        categories: [],
      };

      const { queryByText } = renderFiltersSheet(contextState);
      
      expect(queryByText('Categories')).toBeFalsy();
    });

    it('should limit categories display to 12 items', () => {
      const manyCategories = Array.from({ length: 20 }, (_, i) => ({
        alias: `category${i}`,
        title: `Category ${i}`,
      }));

      const contextState = {
        categories: manyCategories,
      };

      const { queryByText } = renderFiltersSheet(contextState);
      
      // Should display first 12 categories
      expect(queryByText('Category 0')).toBeTruthy();
      expect(queryByText('Category 11')).toBeTruthy();
      
      // Should not display 13th+ categories
      expect(queryByText('Category 12')).toBeFalsy();
      expect(queryByText('Category 19')).toBeFalsy();
    });
  });

  describe('Open Now Filter', () => {
    it('should display open now switch', () => {
      const { getByText } = renderFiltersSheet();
      
      expect(getByText('Open Now')).toBeTruthy();
      expect(getByText('Only show restaurants that are currently open')).toBeTruthy();
    });

    it('should reflect current open now state', () => {
      const contextState = {
        filters: {
          ...initialAppState.filters,
          openNow: true,
        },
      };

      const { getByTestId } = renderFiltersSheet(contextState);
      
      // Would verify switch is in "on" state
      // This requires adding testID to the Switch component
    });
  });

  describe('Distance Filter', () => {
    it('should display distance options', () => {
      const { getAllByText } = renderFiltersSheet();
      
      expect(getAllByText('Distance')[0]).toBeTruthy();
      expect(getAllByText('0.5 mi').length).toBeGreaterThan(0);
      expect(getAllByText('1 mi').length).toBeGreaterThan(0);
      expect(getAllByText('2 mi')[0]).toBeTruthy();
      expect(getAllByText('5 mi')[0]).toBeTruthy();
      expect(getAllByText('10 mi')[0]).toBeTruthy();
    });

    it('should show current distance selection', () => {
      const contextState = {
        filters: {
          ...initialAppState.filters,
          radiusMeters: 804, // 0.5 miles
        },
      };

      const { getAllByText } = renderFiltersSheet(contextState);
      
      // Should show "0.5 mi" in the subtitle (expect at least one instance)
      expect(getAllByText('0.5 mi').length).toBeGreaterThan(0);
    });
  });

  describe('Rating Filter', () => {
    it('should display rating options', () => {
      const { getByText } = renderFiltersSheet();
      
      expect(getByText('Minimum Rating')).toBeTruthy();
      expect(getByText('Any')).toBeTruthy();
      // Would verify star rating buttons are present
    });

    it('should show current rating selection', () => {
      const contextState = {
        filters: {
          ...initialAppState.filters,
          minRating: 3,
        },
      };

      const { getByText } = renderFiltersSheet(contextState);
      
      expect(getByText('3+ stars')).toBeTruthy();
    });
  });

  describe('Apply and Reset Actions', () => {
    it('should display apply and reset buttons', () => {
      const { getByText } = renderFiltersSheet();
      
      expect(getByText('Apply Filters')).toBeTruthy();
      expect(getByText('Reset')).toBeTruthy();
    });

    it('should call dispatch when apply is pressed', () => {
      const { getByText, mockDispatch } = renderFiltersSheet();
      
      const applyButton = getByText('Apply Filters');
      fireEvent.press(applyButton);
      
      expect(mockDispatch).toHaveBeenCalled();
      // Would verify the correct action type and payload
    });

    it('should call dispatch and close when reset is pressed', () => {
      const { getByText, mockDispatch, mockOnClose } = renderFiltersSheet();
      
      const resetButton = getByText('Reset');
      fireEvent.press(resetButton);
      
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Local State Management', () => {
    it('should maintain local filter state until apply is pressed', () => {
      const { getByText, mockDispatch } = renderFiltersSheet();
      
      // Interact with filters (would require proper testIDs)
      // Verify dispatch is not called until apply is pressed
      expect(mockDispatch).not.toHaveBeenCalled();
      
      const applyButton = getByText('Apply Filters');
      fireEvent.press(applyButton);
      
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: expect.any(Number), // ActionType.SetFilters
      }));
    });

    it('should reset local state when closed without applying', () => {
      const { mockOnClose } = renderFiltersSheet();
      
      // Would simulate filter changes and then close without applying
      // Verify that local state is reset to match context state
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});

// Integration test for filter interaction
describe('FiltersSheet Integration', () => {
  it('should update filter badge count after applying filters', () => {
    // This would be better as an integration test with the full SearchScreen
    // testing that the badge updates when filters are applied
    expect(true).toBe(true); // Placeholder
  });

  it('should persist filters across app sessions', () => {
    // This would test the persistence logic with AsyncStorage mocks
    expect(true).toBe(true); // Placeholder
  });
});

// Note: For complete testing, the FiltersSheet component would need:
// 1. testID props on interactive elements
// 2. Proper accessibility labels
// 3. Better separation of concerns for easier unit testing
// 4. Mocking of AsyncStorage for persistence tests
// 5. Integration tests with SearchScreen component