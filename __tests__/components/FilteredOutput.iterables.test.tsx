import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FilteredOutput from '../../components/search/FilteredOutput';
import { RootContext } from '../../context/RootContext';
import { initialAppState } from '../../context/state';
import { ResultsProps } from '../../hooks/useResults';

// Mock ResultsList component since we're testing FilteredOutput in isolation
jest.mock('../../components/results/ResultsList', () => {
  return function MockResultsList({ ListHeaderComponent }: any) {
    // Render the header if provided so we can test FilteredOutput's ListHeader
    return ListHeaderComponent || null;
  };
});

// Mock FilterModal component
jest.mock('../../components/filter/FilterModal', () => {
  return function MockFilterModal() {
    return null;
  };
});

interface TestWrapperProps {
  children: React.ReactNode;
}

function TestWrapper({ children }: TestWrapperProps) {
  const mockDispatch = jest.fn();
  const contextValue = {
    state: initialAppState,
    dispatch: mockDispatch,
  };

  return (
    <SafeAreaProvider initialMetrics={{ insets: { top: 0, left: 0, right: 0, bottom: 0 }, frame: { x: 0, y: 0, width: 0, height: 0 } }}>
      <RootContext.Provider value={contextValue}>
        {children}
      </RootContext.Provider>
    </SafeAreaProvider>
  );
}

describe('FilteredOutput Iterables Safety', () => {
  const validResults: ResultsProps = {
    id: 'test',
    businesses: [
      {
        id: 'test1',
        name: 'Test Restaurant',
        categories: [{ alias: 'italian', title: 'Italian' }],
        image_url: 'test.jpg',
        rating: 4.5,
        review_count: 100,
        price: '$$',
        location: { city: 'Test City', display_address: ['123 Test St'] },
        coordinates: { latitude: 0, longitude: 0 },
        is_closed: false,
        url: 'test.com',
        phone: '555-0123',
        display_phone: '(555) 012-3456',
        photos: [],
        transactions: [],
        alias: 'test-restaurant',
        distance: 1000,
        hours: [],
      }
    ]
  };

  it('handles undefined businesses in search results', () => {
    const resultsWithUndefinedBusinesses = {
      id: 'test',
      businesses: undefined as any,
    };

    expect(() => {
      render(
        <TestWrapper>
          <FilteredOutput
            term="pizza"
            filterTerm=""
            searchResults={resultsWithUndefinedBusinesses}
            filteredResults={validResults}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles null businesses in filtered results', () => {
    const resultsWithNullBusinesses = {
      id: 'test',
      businesses: null as any,
    };

    expect(() => {
      render(
        <TestWrapper>
          <FilteredOutput
            term="pizza"
            filterTerm=""
            searchResults={validResults}
            filteredResults={resultsWithNullBusinesses}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles completely missing businesses property', () => {
    const resultsWithoutBusinesses = {
      id: 'test',
      // businesses property missing entirely
    } as any;

    expect(() => {
      render(
        <TestWrapper>
          <FilteredOutput
            term="pizza"
            filterTerm=""
            searchResults={resultsWithoutBusinesses}
            filteredResults={resultsWithoutBusinesses}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles empty businesses arrays', () => {
    const emptyResults: ResultsProps = {
      id: 'test',
      businesses: [],
    };

    expect(() => {
      render(
        <TestWrapper>
          <FilteredOutput
            term="pizza"
            filterTerm=""
            searchResults={emptyResults}
            filteredResults={emptyResults}
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('correctly displays count when businesses is undefined', () => {
    const resultsWithUndefinedBusinesses = {
      id: 'test',
      businesses: undefined as any,
    };

    const { getByText } = render(
      <TestWrapper>
        <FilteredOutput
          term="pizza"
          filterTerm=""
          searchResults={resultsWithUndefinedBusinesses}
          filteredResults={resultsWithUndefinedBusinesses}
        />
      </TestWrapper>
    );

    // Should show 0 count instead of crashing
    expect(getByText('0 for pizza')).toBeTruthy();
  });

  it('correctly displays count with valid businesses', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilteredOutput
          term="pizza"
          filterTerm=""
          searchResults={validResults}
          filteredResults={validResults}
        />
      </TestWrapper>
    );

    expect(getByText('1 for pizza')).toBeTruthy();
  });

  it('returns null for empty search term', () => {
    const { queryByText } = render(
      <TestWrapper>
        <FilteredOutput
          term="" // Empty term should return null
          filterTerm=""
          searchResults={validResults}
          filteredResults={validResults}
        />
      </TestWrapper>
    );

    // Component should not render the results text for empty search term
    expect(queryByText(/for/)).toBeNull();
  });

  it('prioritizes filtered results over search results', () => {
    const searchResults: ResultsProps = {
      id: 'search',
      businesses: [
        {
          id: 'search1',
          name: 'Search Restaurant',
          categories: [],
          image_url: '',
          rating: 3.0,
          review_count: 50,
          price: '$',
          location: { city: 'Search City', display_address: [] },
          coordinates: { latitude: 0, longitude: 0 },
          is_closed: false,
          url: '',
          phone: '',
          display_phone: '',
          photos: [],
          transactions: [],
          alias: 'search-restaurant',
          distance: 2000,
          hours: [],
        },
        {
          id: 'search2',
          name: 'Another Search Restaurant',
          categories: [],
          image_url: '',
          rating: 4.0,
          review_count: 75,
          price: '$$',
          location: { city: 'Search City', display_address: [] },
          coordinates: { latitude: 0, longitude: 0 },
          is_closed: false,
          url: '',
          phone: '',
          display_phone: '',
          photos: [],
          transactions: [],
          alias: 'another-search-restaurant',
          distance: 1500,
          hours: [],
        }
      ]
    };

    const filteredResults: ResultsProps = {
      id: 'filtered',
      businesses: [validResults.businesses[0]] // Only one filtered result
    };

    const { getByText } = render(
      <TestWrapper>
        <FilteredOutput
          term="pizza"
          filterTerm=""
          searchResults={searchResults} // 2 businesses
          filteredResults={filteredResults} // 1 business
        />
      </TestWrapper>
    );

    // Should show filtered results count (1), not search results count (2)
    expect(getByText('1 for pizza')).toBeTruthy();
  });
});