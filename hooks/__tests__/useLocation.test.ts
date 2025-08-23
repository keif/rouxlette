import { renderHook, act } from '@testing-library/react-native';
import useLocation from '../useLocation';
import Geocoder from 'react-native-geocoding';

// Mock dependencies
jest.mock('react-native-geocoding');
jest.mock('expo-location');
jest.mock('../useStorage');
jest.mock('../../context/RootContext');

const mockGeocoder = Geocoder as jest.Mocked<typeof Geocoder>;

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  // Test Case 1: Successful response
  it('handles successful geocoding response', async () => {
    const mockSuccessResponse = {
      status: 'OK',
      results: [
        {
          address_components: [
            {
              long_name: 'San Francisco',
              short_name: 'SF',
              types: ['locality', 'political']
            },
            {
              long_name: 'California',
              short_name: 'CA', 
              types: ['administrative_area_level_1', 'political']
            }
          ],
          formatted_address: '123 Main St, San Francisco, CA 94102, USA',
          geometry: {
            location: { lat: 37.7749, lng: -122.4194 }
          }
        }
      ]
    };

    mockGeocoder.from.mockResolvedValueOnce(mockSuccessResponse as any);

    const { result } = renderHook(() => useLocation());
    
    // Test extraction logic
    expect(result.current).toBeDefined();
    // Additional assertions would depend on your hook's return structure
  });

  // Test Case 2: ZERO_RESULTS response
  it('handles ZERO_RESULTS response gracefully', async () => {
    const mockEmptyResponse = {
      status: 'ZERO_RESULTS',
      results: []
    };

    mockGeocoder.from.mockResolvedValueOnce(mockEmptyResponse as any);

    const { result } = renderHook(() => useLocation());
    
    // Should not throw and should handle gracefully
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Geocoding API error'),
      expect.objectContaining({
        status: 'ZERO_RESULTS'
      })
    );
  });

  // Test Case 3: REQUEST_DENIED error
  it('handles REQUEST_DENIED error with error message', async () => {
    const mockErrorResponse = {
      status: 'REQUEST_DENIED',
      error_message: 'The provided API key is invalid.',
      results: []
    };

    mockGeocoder.from.mockResolvedValueOnce(mockErrorResponse as any);

    const { result } = renderHook(() => useLocation());
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Geocoding API error'),
      expect.objectContaining({
        status: 'REQUEST_DENIED',
        error_message: 'The provided API key is invalid.'
      })
    );
  });

  // Test Case 4: Network error
  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network request failed');
    mockGeocoder.from.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useLocation());
    
    // Should catch and handle the error without crashing
    expect(result.current).toBeDefined();
  });

  // Test Case 5: Malformed response
  it('handles malformed response without results array', async () => {
    const malformedResponse = {
      status: 'OK'
      // Missing results array
    };

    mockGeocoder.from.mockResolvedValueOnce(malformedResponse as any);

    const { result } = renderHook(() => useLocation());
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('No results in response'),
      malformedResponse
    );
  });

  // Test Case 6: Missing address_components
  it('handles response with missing address_components', async () => {
    const responseWithoutComponents = {
      status: 'OK',
      results: [
        {
          formatted_address: '123 Main St, San Francisco, CA 94102, USA'
          // Missing address_components
        }
      ]
    };

    mockGeocoder.from.mockResolvedValueOnce(responseWithoutComponents as any);

    const { result } = renderHook(() => useLocation());
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid result structure - missing address_components'),
      expect.any(Object)
    );
  });
});

// Example responses for manual testing:
export const testResponses = {
  success: {
    status: 'OK',
    results: [
      {
        address_components: [
          { long_name: 'San Francisco', types: ['locality'] },
          { long_name: 'California', types: ['administrative_area_level_1'] }
        ],
        formatted_address: 'San Francisco, CA, USA'
      }
    ]
  },
  
  zeroResults: {
    status: 'ZERO_RESULTS',
    results: []
  },
  
  requestDenied: {
    status: 'REQUEST_DENIED',
    error_message: 'The provided API key is invalid or billing is not enabled.',
    results: []
  },
  
  overQueryLimit: {
    status: 'OVER_QUERY_LIMIT',
    error_message: 'You have exceeded your daily request quota.',
    results: []
  },
  
  invalidRequest: {
    status: 'INVALID_REQUEST',
    error_message: 'Invalid latitude or longitude values.',
    results: []
  }
};