/**
 * Tests for YelpClient to ensure safe logging and network error handling
 */

import axios from 'axios';
import * as log from '../../utils/log';

// Mock environment variables first
jest.mock('@env', () => ({
  YELP_API_KEY: 'test-api-key',
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Setup axios.create mock before importing yelpClient  
const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};
mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

// Mock axios.isAxiosError to return true for our test errors
mockedAxios.isAxiosError.mockImplementation((error: any) => {
  return error && error.isAxiosError === true;
});

// Mock logging utilities
jest.mock('../../utils/log', () => ({
  logSafe: jest.fn(),
  logNetwork: jest.fn(),
}));

const mockLogSafe = log.logSafe as jest.MockedFunction<typeof log.logSafe>;
const mockLogNetwork = log.logNetwork as jest.MockedFunction<typeof log.logNetwork>;

describe('YelpClient', () => {
  let YelpClient: any;
  let client: any;

  beforeAll(() => {
    // Import YelpClient only after mocks are set up
    const yelpClientModule = require('../yelpClient');
    YelpClient = yelpClientModule.YelpClient;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    client = new YelpClient();
  });

  describe('searchBusinesses', () => {
    test('should log safe metadata for successful search', async () => {
      const mockResponse = {
        status: 200,
        data: {
          businesses: [
            {
              id: 'test-business-1',
              name: 'Test Restaurant',
              rating: 4.5,
              categories: [{ title: 'Italian' }, { title: 'Pizza' }],
              price: '$$',
            },
            {
              id: 'test-business-2',
              name: 'Another Restaurant',
              rating: 4.0,
              categories: [{ title: 'Mexican' }],
              price: '$$$',
            },
          ],
          total: 50,
          region: {
            center: {
              latitude: 40.7128,
              longitude: -74.0060,
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = {
        term: 'pizza',
        location: 'New York, NY',
        limit: 20,
      };

      await client.searchBusinesses(params);

      // Should log search start with safe parameters
      expect(mockLogSafe).toHaveBeenCalledWith(
        'YelpClient:searchBusinesses:start',
        expect.objectContaining({
          term: 'pizza',
          location: 'New York, NY',
          limit: 20,
          requestNumber: expect.any(Number),
        })
      );

      // Should log network call with metadata only
      expect(mockLogNetwork).toHaveBeenCalledWith(
        'GET',
        '/businesses/search',
        params,
        expect.objectContaining({
          status: 200,
          data: expect.objectContaining({
            businessCount: 2,
            total: 50,
            hasMoreResults: true,
            regionCenter: '40.7128,-74.006',
            categories: expect.arrayContaining(['Italian', 'Pizza', 'Mexican']),
            averageRating: 4.25,
            priceRange: ['$$', '$$$'],
          }),
          duration: expect.any(Number),
        })
      );

      // Should NOT log full business objects
      expect(mockLogSafe).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          businesses: expect.any(Array),
        })
      );
    });

    test('should handle API errors safely', async () => {
      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {
            error: {
              description: 'Invalid location parameter',
            },
          },
          headers: {
            'ratelimit-remaining': '4999',
          },
        },
        config: {
          url: '/businesses/search',
          params: { term: 'invalid', location: '' },
        },
        code: 'ERR_BAD_REQUEST',
      });

      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);

      await expect(
        client.searchBusinesses({ term: 'invalid', location: '' })
      ).rejects.toThrow('Bad Request');

      // Should log error with safe metadata
      expect(mockLogSafe).toHaveBeenCalledWith(
        'YelpClient:api-error',
        expect.objectContaining({
          endpoint: '/businesses/search',
          status: 400,
          statusText: 'Bad Request',
          code: 'ERR_BAD_REQUEST',
          duration: expect.any(Number),
          rateLimitRemaining: '4999',
          errorDescription: 'Invalid location parameter',
          params: expect.objectContaining({
            term: 'invalid',
            location: '',
          }),
        })
      );
    });
  });

  describe('getBusinessDetails', () => {
    test('should log business metadata only, not full details', async () => {
      const mockBusiness = {
        id: 'test-business-id',
        name: 'Test Restaurant',
        rating: 4.5,
        review_count: 120,
        categories: [{ title: 'Italian' }, { title: 'Pizza' }],
        photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
        hours: {
          open: [
            {
              is_overnight: false,
              start: '1100',
              end: '2200',
              day: 1,
            },
          ],
        },
        // Large detailed info that should NOT be logged
        location: {
          address1: '123 Main St',
          address2: 'Suite 100',
          address3: '',
          city: 'New York',
          zip_code: '10001',
          country: 'US',
          state: 'NY',
          display_address: ['123 Main St', 'Suite 100', 'New York, NY 10001'],
        },
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        // ... many more fields that would create large payloads
      };

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: mockBusiness,
      });

      await client.getBusinessDetails('test-business-id');

      // Should log only essential metadata
      expect(mockLogNetwork).toHaveBeenCalledWith(
        'GET',
        '/businesses/test-business-id',
        undefined,
        expect.objectContaining({
          status: 200,
          data: {
            id: 'test-business-id',
            name: 'Test Restaurant',
            rating: 4.5,
            reviewCount: 120,
            categories: 2,
            photos: 3,
            hours: 'present',
          },
          duration: expect.any(Number),
        })
      );

      // Should NOT log full business object
      expect(mockLogSafe).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          location: expect.any(Object),
          coordinates: expect.any(Object),
        })
      );
    });
  });

  describe('getBusinessReviews', () => {
    test('should log review metadata, never full review text', async () => {
      const mockReviews = {
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            text: 'This is an amazing restaurant with incredible food and service...', // Long review text
            time_created: '2023-01-15T10:00:00',
            user: {
              id: 'user-1',
              name: 'John D.',
              // ... user details
            },
          },
          {
            id: 'review-2',
            rating: 4,
            text: 'Good food, but service could be better. The ambiance is nice...', // Another long review
            time_created: '2023-01-10T15:30:00',
            user: {
              id: 'user-2',
              name: 'Sarah M.',
              // ... user details
            },
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: mockReviews,
      });

      await client.getBusinessReviews('test-business-id', 20);

      // Should log only review metadata
      expect(mockLogNetwork).toHaveBeenCalledWith(
        'GET',
        '/businesses/test-business-id/reviews',
        { limit: 20 },
        expect.objectContaining({
          status: 200,
          data: {
            reviewCount: 2,
            averageRating: 4.5,
            dateRange: {
              newest: '2023-01-15T10:00:00',
              oldest: '2023-01-10T15:30:00',
            },
          },
          duration: expect.any(Number),
        })
      );

      // Should NEVER log full review text or user details
      expect(mockLogSafe).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reviews: expect.any(Array),
        })
      );

      // Verify no review text appears in any log call
      const allLogCalls = mockLogSafe.mock.calls.concat(mockLogNetwork.mock.calls);
      const hasReviewText = allLogCalls.some(call => 
        JSON.stringify(call).includes('amazing restaurant with incredible')
      );
      expect(hasReviewText).toBe(false);
    });
  });

  describe('categories caching', () => {
    test('should log cache hits and misses safely', async () => {
      const mockCategories = {
        categories: new Array(200).fill(0).map((_, i) => ({
          alias: `category-${i}`,
          title: `Category ${i}`,
          parent_aliases: [],
          country_whitelist: [],
          country_blacklist: [],
        })),
      };

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: mockCategories,
      });

      // First call - should fetch and cache
      await client.getCategories();

      expect(mockLogNetwork).toHaveBeenCalledWith(
        'GET',
        '/categories',
        undefined,
        expect.objectContaining({
          status: 200,
          data: {
            categoriesCount: 200,
            cached: false,
          },
          duration: expect.any(Number),
        })
      );

      jest.clearAllMocks();

      // Second call - should use cache
      await client.getCategories();

      expect(mockLogSafe).toHaveBeenCalledWith(
        'YelpClient:getCategories:cache-hit',
        expect.objectContaining({
          categoriesCount: 200,
          cacheAge: expect.any(Number),
        })
      );

      // Should NOT log full categories array
      expect(mockLogSafe).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          categories: expect.any(Array),
        })
      );
    });
  });

  describe('client statistics', () => {
    test('should provide debug stats without sensitive data', () => {
      const stats = client.getStats();

      expect(stats).toEqual({
        totalRequests: expect.any(Number),
        lastRequestTime: expect.any(Number),
        categoriesCached: expect.any(Boolean),
        categoriesCacheAge: expect.any(Number),
      });

      // Stats should not contain API keys or tokens
      expect(JSON.stringify(stats)).not.toContain('Bearer');
      expect(JSON.stringify(stats)).not.toContain('test-api-key');
    });
  });

  describe('payload size safety', () => {
    test('should never log objects that could cause PayloadTooLargeError', async () => {
      // Create a massive mock response that would normally cause issues
      const massiveBusinesses = new Array(1000).fill(0).map((_, i) => ({
        id: `business-${i}`,
        name: `Business ${i}`,
        rating: 4.0 + Math.random(),
        review_count: Math.floor(Math.random() * 1000),
        categories: new Array(10).fill(0).map((_, j) => ({
          title: `Category ${j}`,
          alias: `category-${j}`,
        })),
        location: {
          address1: `${i} Main Street`,
          address2: `Suite ${i}`,
          city: 'Test City',
          zip_code: `1000${i % 10}`,
          country: 'US',
          state: 'NY',
          display_address: [`${i} Main Street`, `Suite ${i}`, `Test City, NY 1000${i % 10}`],
        },
        coordinates: {
          latitude: 40.7128 + Math.random() * 0.1,
          longitude: -74.0060 + Math.random() * 0.1,
        },
        photos: new Array(20).fill(0).map((_, j) => `https://example.com/photo-${i}-${j}.jpg`),
        // Add more large data that would cause payload issues
        description: 'x'.repeat(1000), // 1KB string per business
      }));

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          businesses: massiveBusinesses,
          total: 5000,
        },
      });

      await client.searchBusinesses({ term: 'test' });

      // Verify that no single log call contains the massive businesses array
      const allLogCalls = [...mockLogSafe.mock.calls, ...mockLogNetwork.mock.calls];
      
      for (const call of allLogCalls) {
        const serialized = JSON.stringify(call);
        // Each log payload should be reasonable size (< 50KB)
        expect(serialized.length).toBeLessThan(50000);
        
        // Should not contain massive arrays
        expect(serialized).not.toMatch(/"businesses":\s*\[/);
        expect(serialized).not.toMatch(/"photos":\s*\[.*https:\/\/example\.com\/photo-/);
      }
    });
  });
});
