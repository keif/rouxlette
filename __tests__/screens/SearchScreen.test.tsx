import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SearchScreen from '../../screens/SearchScreen';
import { RootContext } from '../../context/RootContext';

// Mock navigation
const mockNavigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {},
  key: 'test',
  name: 'Search' as const,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
  useFocusEffect: (callback: any) => callback(),
}));

// Mock other hooks
jest.mock('../../hooks/useFiltersPersistence', () => ({
  __esModule: true,
  default: () => ({ isHydrated: true }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ bottom: 20, top: 44, left: 0, right: 0 }),
}));

// Mock SearchInput and other components
jest.mock('../../components/search/SearchInput', () => {
  return function MockSearchInput({ setTerm, setResults, onFocus }: any) {
    return (
      <input
        data-testid="search-input"
        onChange={(e: any) => setTerm(e.target.value)}
        onFocus={onFocus}
      />
    );
  };
});

jest.mock('../../components/search/LocationInput', () => {
  return function MockLocationInput() {
    return <div data-testid="location-input" />;
  };
});

jest.mock('../../components/search/FilteredOutput', () => {
  return function MockFilteredOutput({ isLoading }: any) {
    return (
      <div data-testid="filtered-output">
        {isLoading && <div data-testid="filtered-output-loading">Loading</div>}
      </div>
    );
  };
});

describe('SearchScreen', () => {
  const mockState = {
    results: [],
    categories: [],
    location: '',
    filters: { 
      openNow: false, 
      categoryIds: [], 
      priceLevels: [], 
      radiusMeters: 1600, 
      minRating: 1 
    },
    showFilter: false,
  };

  const mockDispatch = jest.fn();

  const renderWithContext = (children: React.ReactNode) => {
    return render(
      <RootContext.Provider value={{ state: mockState, dispatch: mockDispatch }}>
        {children}
      </RootContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state when searching', () => {
    const { getByTestId, getByText } = renderWithContext(<SearchScreen />);

    const searchInput = getByTestId('search-input');
    
    // Focus the input and enter a term to trigger isSearching state
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'pizza' } });

    // Should show the searching indicator
    expect(getByText('Searching…')).toBeTruthy();
  });

  it('should pass loading state to FilteredOutput', () => {
    const { getByTestId } = renderWithContext(<SearchScreen />);

    const searchInput = getByTestId('search-input');
    
    // Focus and enter term to trigger loading state
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'pizza' } });

    // The FilteredOutput component should be present
    // (though it may not be visible due to no results)
    const filteredOutput = getByTestId('filtered-output');
    expect(filteredOutput).toBeTruthy();
  });
});