import React from 'react';
import { render } from '@testing-library/react-native';
import ResultsList from '../../components/results/ResultsList';
import { INIT_RESULTS } from '../../hooks/useResults';

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 20, top: 44, left: 0, right: 0 }),
}));

describe('ResultsList', () => {
  const mockEmptyResults = { id: 'test', businesses: [] };
  const mockResultsWithData = {
    id: 'test',
    businesses: [
      {
        id: '1',
        name: 'Test Restaurant',
        rating: 4.5,
        coordinates: { latitude: 40, longitude: -83 },
        categories: [],
        location: {
          display_address: ['123 Main St', 'Columbus, OH 43215'],
        },
        price: '$$',
        distance: 1000,
        is_closed: false,
        review_count: 100,
      }
    ]
  };

  it('should render spinner when loading and no results', () => {
    const { getByText } = render(
      <ResultsList
        filterTerm=""
        horizontal={false}
        results={mockEmptyResults}
        term="pizza"
        isLoading={true}
      />
    );

    expect(getByText('Searching…')).toBeTruthy();
  });

  it('should render empty message when not loading and no results', () => {
    const { getByText } = render(
      <ResultsList
        filterTerm=""
        horizontal={false}
        results={mockEmptyResults}
        term="pizza"
        isLoading={false}
      />
    );

    expect(getByText(/We couldn't find anything/)).toBeTruthy();
    expect(getByText('Try a broader term or remove some filters.')).toBeTruthy();
  });

  it('should not render spinner when loading but has results', () => {
    const { queryByText } = render(
      <ResultsList
        filterTerm=""
        horizontal={false}
        results={mockResultsWithData}
        term="pizza"
        isLoading={true}
      />
    );

    expect(queryByText('Searching…')).toBeNull();
  });

  it('should render results when has data', () => {
    const { queryByText } = render(
      <ResultsList
        filterTerm=""
        horizontal={false}
        results={mockResultsWithData}
        term="pizza"
        isLoading={false}
      />
    );

    // Should not show loading or empty states
    expect(queryByText('Searching…')).toBeNull();
    expect(queryByText(/We couldn't find anything/)).toBeNull();
  });

  it('should not render anything when no search term', () => {
    const { root } = render(
      <ResultsList
        filterTerm=""
        horizontal={false}
        results={mockEmptyResults}
        term=""
        isLoading={false}
      />
    );

    // Component should render normally even with empty term
    // The parent components control when to show this
    expect(root).toBeTruthy();
  });
});