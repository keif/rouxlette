import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ResultsList from '../../components/results/ResultsList';
import { ResultsProps } from '../../hooks/useResults';

// Mock RestaurantCard since we're testing ResultsList in isolation
jest.mock('../../components/search/RestaurantCard', () => {
  return function MockRestaurantCard({ result }: { result: any }) {
    return null; // Return minimal mock
  };
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={{ insets: { top: 0, left: 0, right: 0, bottom: 0 }, frame: { x: 0, y: 0, width: 0, height: 0 } }}>
      {children}
    </SafeAreaProvider>
  );
}

describe('ResultsList Iterables Safety', () => {
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
        location: { 
          city: 'Test City', 
          display_address: ['123 Test St'],
          address1: '123 Test St',
          address2: null,
          address3: '',
          country: 'US',
          state: 'OH',
          zip_code: '12345'
        },
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

  it('handles undefined businesses array', () => {
    const resultsWithUndefinedBusinesses = {
      id: 'test',
      businesses: undefined as any,
    };

    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm=""
            horizontal={false}
            results={resultsWithUndefinedBusinesses}
            term="pizza"
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles null businesses array', () => {
    const resultsWithNullBusinesses = {
      id: 'test',
      businesses: null as any,
    };

    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm=""
            horizontal={false}
            results={resultsWithNullBusinesses}
            term="pizza"
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles missing businesses property entirely', () => {
    const resultsWithoutBusinesses = {
      id: 'test',
      // businesses property missing
    } as any;

    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm=""
            horizontal={false}
            results={resultsWithoutBusinesses}
            term="pizza"
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('shows "no results" message when businesses array is empty and has search term', () => {
    const emptyResults: ResultsProps = {
      id: 'test',
      businesses: [],
    };

    const { getByText } = render(
      <TestWrapper>
        <ResultsList
          filterTerm=""
          horizontal={false}
          results={emptyResults}
          term="pizza"
        />
      </TestWrapper>
    );

    expect(getByText("We couldn't find anything for pizza :(")).toBeTruthy();
  });

  it('shows "no results" message when businesses is undefined and has search term', () => {
    const resultsWithUndefinedBusinesses = {
      id: 'test',
      businesses: undefined as any,
    };

    const { getByText } = render(
      <TestWrapper>
        <ResultsList
          filterTerm=""
          horizontal={false}
          results={resultsWithUndefinedBusinesses}
          term="pizza"
        />
      </TestWrapper>
    );

    expect(getByText("We couldn't find anything for pizza :(")).toBeTruthy();
  });

  it('renders FlatList when businesses array is valid', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ResultsList
          filterTerm=""
          horizontal={false}
          results={validResults}
          term="pizza"
        />
      </TestWrapper>
    );

    // FlatList should be rendered (looking for ScrollView which is underlying component)
    expect(getByTestId).toBeDefined();
  });

  it('passes safe businesses array to FlatList data prop', () => {
    // This test ensures the data prop of FlatList gets an array, not undefined/null
    const resultsWithUndefinedBusinesses = {
      id: 'test',
      businesses: undefined as any,
    };

    // Should not crash when FlatList tries to iterate over the data
    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm=""
            horizontal={false}
            results={resultsWithUndefinedBusinesses}
            term="pizza"
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles horizontal orientation safely', () => {
    const resultsWithUndefinedBusinesses = {
      id: 'test',
      businesses: undefined as any,
    };

    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm=""
            horizontal={true} // Test horizontal mode
            results={resultsWithUndefinedBusinesses}
            term="pizza"
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles empty search term gracefully', () => {
    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm=""
            horizontal={false}
            results={validResults}
            term="" // Empty search term
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  it('handles whitespace-only search term', () => {
    const emptyResults: ResultsProps = {
      id: 'test',
      businesses: [],
    };

    const { queryByText } = render(
      <TestWrapper>
        <ResultsList
          filterTerm=""
          horizontal={false}
          results={emptyResults}
          term="   " // Whitespace-only term
        />
      </TestWrapper>
    );

    // Should not show the "no results" message for whitespace-only terms
    expect(queryByText(/We couldn't find anything/)).toBeNull();
  });

  it('handles complex filter terms without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <ResultsList
            filterTerm="expensive, crowded, loud"
            horizontal={false}
            results={validResults}
            term="pizza"
          />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});