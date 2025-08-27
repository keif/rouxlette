import { geocode, reverseGeocode, humanizeGeocodeError, GeocodeResponse } from '../../api/google';

// Mock axios
jest.mock('axios');

const mockAxios = {
  create: jest.fn(() => mockAxios),
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

// Mock the axios instance
require('axios').default = mockAxios;

describe('Google API Normalizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('geocode', () => {
    it('handles empty query without making API call', async () => {
      const result = await geocode('');
      
      expect(result).toEqual({
        ok: false,
        status: 'EMPTY_QUERY',
        results: [],
        raw: null,
        errorMessage: 'No query provided'
      });
      
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('handles null/undefined query without making API call', async () => {
      const resultNull = await geocode(null);
      const resultUndefined = await geocode(undefined);
      
      const expectedResponse = {
        ok: false,
        status: 'EMPTY_QUERY',
        results: [],
        raw: null,
        errorMessage: 'No query provided'
      };
      
      expect(resultNull).toEqual(expectedResponse);
      expect(resultUndefined).toEqual(expectedResponse);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('normalizes successful Google response', async () => {
      const mockSuccessResponse = {
        status: 'OK',
        results: [
          {
            address_components: [
              { long_name: 'San Francisco', types: ['locality'] }
            ],
            formatted_address: 'San Francisco, CA, USA'
          }
        ]
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockSuccessResponse });

      const result = await geocode('San Francisco');

      expect(result).toEqual({
        ok: true,
        status: 'OK',
        results: mockSuccessResponse.results,
        raw: mockSuccessResponse,
        errorMessage: undefined
      });
    });

    it('handles ZERO_RESULTS response', async () => {
      const mockZeroResults = {
        status: 'ZERO_RESULTS',
        results: []
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockZeroResults });

      const result = await geocode('Nonexistent Place');

      expect(result).toEqual({
        ok: false,
        status: 'ZERO_RESULTS',
        results: [],
        raw: mockZeroResults,
        errorMessage: undefined
      });
    });

    it('handles REQUEST_DENIED error', async () => {
      const mockErrorResponse = {
        status: 'REQUEST_DENIED',
        error_message: 'The provided API key is invalid.',
        results: []
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockErrorResponse });

      const result = await geocode('Test Query');

      expect(result).toEqual({
        ok: false,
        status: 'REQUEST_DENIED',
        results: [],
        raw: mockErrorResponse,
        errorMessage: 'The provided API key is invalid.'
      });
    });

    it('normalizes array-top-level response', async () => {
      const mockArrayResponse = [
        {
          address_components: [
            { long_name: 'New York', types: ['locality'] }
          ],
          formatted_address: 'New York, NY, USA'
        }
      ];

      mockAxios.get.mockResolvedValueOnce({ data: mockArrayResponse });

      const result = await geocode('New York');

      expect(result).toEqual({
        ok: true,
        status: 'OK',
        results: mockArrayResponse,
        raw: mockArrayResponse,
        errorMessage: undefined
      });
    });

    it('handles empty array response', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await geocode('Empty Results');

      expect(result).toEqual({
        ok: false,
        status: 'ZERO_RESULTS',
        results: [],
        raw: [],
        errorMessage: 'No results found'
      });
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network request failed');
      mockAxios.get.mockRejectedValueOnce(networkError);

      const result = await geocode('Test Query');

      expect(result).toEqual({
        ok: false,
        status: 'NETWORK_ERROR',
        results: [],
        raw: null,
        errorMessage: 'Network request failed'
      });
    });
  });

  describe('reverseGeocode', () => {
    it('handles successful reverse geocoding', async () => {
      const mockResponse = {
        status: 'OK',
        results: [
          {
            address_components: [
              { long_name: 'Los Angeles', types: ['locality'] }
            ],
            formatted_address: 'Los Angeles, CA, USA'
          }
        ]
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await reverseGeocode(34.0522, -118.2437);

      expect(result).toEqual({
        ok: true,
        status: 'OK',
        results: mockResponse.results,
        raw: mockResponse,
        errorMessage: undefined
      });
    });

    it('handles array response in reverse geocoding', async () => {
      const mockArrayResponse = [
        {
          address_components: [
            { long_name: 'Chicago', types: ['locality'] }
          ]
        }
      ];

      mockAxios.get.mockResolvedValueOnce({ data: mockArrayResponse });

      const result = await reverseGeocode(41.8781, -87.6298);

      expect(result).toEqual({
        ok: true,
        status: 'OK',
        results: mockArrayResponse,
        raw: mockArrayResponse,
        errorMessage: undefined
      });
    });
  });

  describe('humanizeGeocodeError', () => {
    it('provides user-friendly error messages', () => {
      const testCases: Array<{ response: GeocodeResponse; expected: string }> = [
        {
          response: { ok: false, status: 'EMPTY_QUERY', results: [], raw: null },
          expected: 'Please enter a location to search'
        },
        {
          response: { ok: false, status: 'ZERO_RESULTS', results: [], raw: null },
          expected: 'No results found for that location'
        },
        {
          response: { ok: false, status: 'REQUEST_DENIED', results: [], raw: null },
          expected: 'Location service unavailable. Please try again later.'
        },
        {
          response: { ok: false, status: 'INVALID_REQUEST', results: [], raw: null },
          expected: 'Invalid location format. Please try a different search.'
        },
        {
          response: { ok: false, status: 'OVER_QUERY_LIMIT', results: [], raw: null },
          expected: 'Location service is busy. Please try again in a moment.'
        },
        {
          response: { ok: false, status: 'NETWORK_ERROR', results: [], raw: null },
          expected: 'Network error. Please check your connection and try again.'
        },
        {
          response: { ok: false, status: 'CUSTOM_ERROR', results: [], raw: null, errorMessage: 'Custom error message' },
          expected: 'Custom error message'
        }
      ];

      testCases.forEach(({ response, expected }) => {
        expect(humanizeGeocodeError(response)).toBe(expected);
      });
    });
  });
});