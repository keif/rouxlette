import { applyFilters, countActiveFilters, DISTANCE_OPTIONS, getDistanceLabel } from '../../utils/filterBusinesses';
import { Filters, initialFilters } from '../../context/state';
import { BusinessProps } from '../../hooks/useResults';

// Mock businesses for testing
const mockBusinesses: BusinessProps[] = [
  {
    id: '1',
    name: 'Pizza Palace',
    rating: 4.5,
    price: '$$',
    categories: [
      { alias: 'pizza', title: 'Pizza' },
      { alias: 'italian', title: 'Italian' }
    ],
    distance: 800, // 0.5 miles
    is_closed: false,
    hours: [{
      hours_type: 'REGULAR',
      is_open_now: true,
      open: []
    }],
    alias: 'pizza-palace',
    coordinates: { latitude: 0, longitude: 0 },
    display_phone: '(555) 123-4567',
    image_url: 'https://example.com/pizza.jpg',
    location: { address1: '123 Pizza St', city: 'Pizza City', state: 'CA', zip_code: '12345', country: 'US', display_address: ['123 Pizza St', 'Pizza City, CA 12345'] },
    phone: '+15551234567',
    photos: ['https://example.com/pizza.jpg'],
    review_count: 128,
    transactions: ['delivery'],
    url: 'https://yelp.com/biz/pizza-palace'
  },
  {
    id: '2',
    name: 'Sushi Spot',
    rating: 4.0,
    price: '$$$',
    categories: [
      { alias: 'sushi', title: 'Sushi' },
      { alias: 'japanese', title: 'Japanese' }
    ],
    distance: 1200, // ~0.75 miles
    is_closed: true,
    hours: [{
      hours_type: 'REGULAR',
      is_open_now: false,
      open: []
    }],
    alias: 'sushi-spot',
    coordinates: { latitude: 0, longitude: 0 },
    display_phone: '(555) 234-5678',
    image_url: 'https://example.com/sushi.jpg',
    location: { address1: '456 Sushi Ave', city: 'Sushi City', state: 'CA', zip_code: '12345', country: 'US', display_address: ['456 Sushi Ave', 'Sushi City, CA 12345'] },
    phone: '+15552345678',
    photos: ['https://example.com/sushi.jpg'],
    review_count: 89,
    transactions: ['pickup'],
    url: 'https://yelp.com/biz/sushi-spot'
  },
  {
    id: '3',
    name: 'Budget Burgers',
    rating: 3.0,
    price: '$',
    categories: [
      { alias: 'burgers', title: 'Burgers' }
    ],
    distance: 500,
    is_closed: false,
    hours: [{
      hours_type: 'REGULAR',
      is_open_now: true,
      open: []
    }],
    alias: 'budget-burgers',
    coordinates: { latitude: 0, longitude: 0 },
    display_phone: '(555) 345-6789',
    image_url: 'https://example.com/burgers.jpg',
    location: { address1: '789 Burger Blvd', city: 'Burger City', state: 'CA', zip_code: '12345', country: 'US', display_address: ['789 Burger Blvd', 'Burger City, CA 12345'] },
    phone: '+15553456789',
    photos: ['https://example.com/burgers.jpg'],
    review_count: 45,
    transactions: ['delivery', 'pickup'],
    url: 'https://yelp.com/biz/budget-burgers'
  },
  {
    id: '4',
    name: 'Expensive Steakhouse',
    rating: 4.8,
    price: '$$$$',
    categories: [
      { alias: 'steakhouses', title: 'Steakhouses' }
    ],
    distance: 1500,
    is_closed: false,
    // No hours data
    alias: 'expensive-steakhouse',
    coordinates: { latitude: 0, longitude: 0 },
    display_phone: '(555) 456-7890',
    image_url: 'https://example.com/steak.jpg',
    location: { address1: '101 Steak St', city: 'Steak City', state: 'CA', zip_code: '12345', country: 'US', display_address: ['101 Steak St', 'Steak City, CA 12345'] },
    phone: '+15554567890',
    photos: ['https://example.com/steak.jpg'],
    review_count: 203,
    transactions: ['reservation'],
    url: 'https://yelp.com/biz/expensive-steakhouse'
  },
  {
    id: '5',
    name: 'No Price Restaurant',
    rating: 3.5,
    categories: [
      { alias: 'american', title: 'American' }
    ],
    distance: 1000,
    is_closed: false,
    hours: [{
      hours_type: 'REGULAR',
      is_open_now: true,
      open: []
    }],
    alias: 'no-price-restaurant',
    coordinates: { latitude: 0, longitude: 0 },
    display_phone: '(555) 567-8901',
    image_url: 'https://example.com/american.jpg',
    location: { address1: '202 American Way', city: 'American City', state: 'CA', zip_code: '12345', country: 'US', display_address: ['202 American Way', 'American City, CA 12345'] },
    phone: '+15555678901',
    photos: ['https://example.com/american.jpg'],
    review_count: 67,
    transactions: ['pickup'],
    url: 'https://yelp.com/biz/no-price-restaurant'
    // No price field
  } as BusinessProps
];

describe('filterBusinesses', () => {
  describe('applyFilters', () => {
    it('should return all businesses when no filters are applied', () => {
      const result = applyFilters(mockBusinesses, initialFilters);
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockBusinesses);
    });

    describe('category filtering', () => {
      it('should filter by single category', () => {
        const filters: Filters = {
          ...initialFilters,
          categoryIds: ['pizza']
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Pizza Palace');
      });

      it('should filter by multiple categories', () => {
        const filters: Filters = {
          ...initialFilters,
          categoryIds: ['pizza', 'sushi']
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(2);
        expect(result.map(b => b.name)).toEqual(['Pizza Palace', 'Sushi Spot']);
      });

      it('should exclude businesses without matching categories', () => {
        const filters: Filters = {
          ...initialFilters,
          categoryIds: ['nonexistent']
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(0);
      });

      it('should handle businesses without categories', () => {
        const businessesWithoutCategories = [
          { ...mockBusinesses[0], categories: undefined },
          mockBusinesses[1]
        ];
        const filters: Filters = {
          ...initialFilters,
          categoryIds: ['sushi']
        };
        const result = applyFilters(businessesWithoutCategories, filters);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Sushi Spot');
      });
    });

    describe('price level filtering', () => {
      it('should filter by single price level', () => {
        const filters: Filters = {
          ...initialFilters,
          priceLevels: [2] // $$
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Pizza Palace');
      });

      it('should filter by multiple price levels', () => {
        const filters: Filters = {
          ...initialFilters,
          priceLevels: [1, 3] // $ and $$$
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(2);
        expect(result.map(b => b.name)).toEqual(['Sushi Spot', 'Budget Burgers']);
      });

      it('should exclude businesses without price information', () => {
        const filters: Filters = {
          ...initialFilters,
          priceLevels: [1]
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Budget Burgers');
        // 'No Price Restaurant' should be excluded
        expect(result.find(b => b.name === 'No Price Restaurant')).toBeUndefined();
      });
    });

    describe('open now filtering', () => {
      it('should filter to only open businesses', () => {
        const filters: Filters = {
          ...initialFilters,
          openNow: true
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(3);
        expect(result.map(b => b.name)).toEqual(['Pizza Palace', 'Budget Burgers', 'No Price Restaurant']);
      });

      it('should exclude businesses without hours data when openNow is true', () => {
        const filters: Filters = {
          ...initialFilters,
          openNow: true
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result.find(b => b.name === 'Expensive Steakhouse')).toBeUndefined();
      });

      it('should include all businesses when openNow is false', () => {
        const filters: Filters = {
          ...initialFilters,
          openNow: false
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(5);
      });
    });

    describe('radius filtering', () => {
      it('should filter by distance radius', () => {
        const filters: Filters = {
          ...initialFilters,
          radiusMeters: 1000 // 1km
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(3);
        expect(result.map(b => b.name)).toEqual(['Pizza Palace', 'Budget Burgers', 'No Price Restaurant']);
      });

      it('should include businesses without distance data', () => {
        const businessesWithoutDistance = [
          { ...mockBusinesses[0], distance: undefined },
          mockBusinesses[1]
        ];
        const filters: Filters = {
          ...initialFilters,
          radiusMeters: 1000
        };
        const result = applyFilters(businessesWithoutDistance, filters);
        expect(result).toHaveLength(1); // Only businesses without distance pass through
        expect(result[0].name).toBe('Pizza Palace');
      });
    });

    describe('minimum rating filtering', () => {
      it('should filter by minimum rating', () => {
        const filters: Filters = {
          ...initialFilters,
          minRating: 4.0
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(3);
        expect(result.map(b => b.name)).toEqual(['Pizza Palace', 'Sushi Spot', 'Expensive Steakhouse']);
      });

      it('should include businesses without rating data when minRating is 0', () => {
        const filters: Filters = {
          ...initialFilters,
          minRating: 0
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(5);
      });

      it('should exclude businesses without rating data when minRating > 0', () => {
        const businessesWithoutRating = [
          { ...mockBusinesses[0], rating: undefined },
          mockBusinesses[1]
        ];
        const filters: Filters = {
          ...initialFilters,
          minRating: 3.0
        };
        const result = applyFilters(businessesWithoutRating, filters);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Sushi Spot');
      });
    });

    describe('combined filtering', () => {
      it('should apply multiple filters together', () => {
        const filters: Filters = {
          ...initialFilters,
          categoryIds: ['pizza', 'burgers'],
          priceLevels: [1, 2],
          openNow: true,
          radiusMeters: 1000,
          minRating: 3.0
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(2);
        expect(result.map(b => b.name)).toEqual(['Pizza Palace', 'Budget Burgers']);
      });

      it('should return empty array when no businesses match all filters', () => {
        const filters: Filters = {
          ...initialFilters,
          categoryIds: ['pizza'],
          priceLevels: [4], // $$$$
          openNow: true,
          radiusMeters: 100,
          minRating: 5.0
        };
        const result = applyFilters(mockBusinesses, filters);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('countActiveFilters', () => {
    it('should return 0 for initial filters', () => {
      expect(countActiveFilters(initialFilters)).toBe(0);
    });

    it('should count category filters', () => {
      const filters = {
        ...initialFilters,
        categoryIds: ['pizza', 'sushi']
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count price level filters', () => {
      const filters = {
        ...initialFilters,
        priceLevels: [1, 2] as Array<1|2|3|4>
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count openNow filter', () => {
      const filters = {
        ...initialFilters,
        openNow: true
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count radius filter when different from default', () => {
      const filters = {
        ...initialFilters,
        radiusMeters: 800
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should not count radius filter when equal to default', () => {
      const filters = {
        ...initialFilters,
        radiusMeters: 1600 // default value
      };
      expect(countActiveFilters(filters)).toBe(0);
    });

    it('should count minRating filter', () => {
      const filters = {
        ...initialFilters,
        minRating: 3.0
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count all active filters', () => {
      const filters = {
        ...initialFilters,
        categoryIds: ['pizza'],
        priceLevels: [1, 2] as Array<1|2|3|4>,
        openNow: true,
        radiusMeters: 800,
        minRating: 3.0
      };
      expect(countActiveFilters(filters)).toBe(5);
    });
  });

  describe('DISTANCE_OPTIONS', () => {
    it('should have correct distance conversions', () => {
      expect(DISTANCE_OPTIONS).toHaveLength(5);
      expect(DISTANCE_OPTIONS[0]).toEqual({ label: '0.5 mi', miles: 0.5, meters: 804 });
      expect(DISTANCE_OPTIONS[1]).toEqual({ label: '1 mi', miles: 1, meters: 1609 });
      expect(DISTANCE_OPTIONS[4]).toEqual({ label: '10 mi', miles: 10, meters: 16093 });
    });
  });

  describe('getDistanceLabel', () => {
    it('should return correct labels for known distances', () => {
      expect(getDistanceLabel(804)).toBe('0.5 mi');
      expect(getDistanceLabel(1609)).toBe('1 mi');
      expect(getDistanceLabel(16093)).toBe('10 mi');
    });

    it('should return calculated label for unknown distances', () => {
      expect(getDistanceLabel(3218)).toBe('2 mi');
      expect(getDistanceLabel(500)).toBe('0.3 mi');
    });
  });
});