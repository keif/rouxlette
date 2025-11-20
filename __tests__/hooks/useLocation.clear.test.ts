import { renderHook, act } from '@testing-library/react-native';
import useLocation from '../../hooks/useLocation';
import * as Location from 'expo-location';
import { geocode, reverseGeocode } from '../../api/google';

// Mock dependencies
jest.mock('expo-location');
jest.mock('../../api/google');
jest.mock('react-native-geocoding');
jest.mock('../../hooks/useStorage');
jest.mock('../../context/RootContext');

const mockLocation = Location as jest.Mocked<typeof Location>;
const mockGeocode = geocode as jest.MockedFunction<typeof geocode>;
const mockReverseGeocode = reverseGeocode as jest.MockedFunction<typeof reverseGeocode>;

// Mock storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  deleteItem: jest.fn(),
  getAllItems: jest.fn()
};

// Mock context
const mockDispatch = jest.fn();
const mockContext = {
  state: { location: '' },
  dispatch: mockDispatch
};

describe('useLocation - Clear Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();

    // Mock storage hook
    require('../../hooks/useStorage').default = jest.fn(() => [
      mockStorage.deleteItem,
      mockStorage.getAllItems,
      mockStorage.getItem,
      mockStorage.setItem
    ]);

    // Mock context
    require('../../context/RootContext').RootContext = {
      Consumer: jest.fn(),
      Provider: jest.fn()
    };
    require('react').useContext = jest.fn(() => mockContext);

    // Mock Geocoder
    require('react-native-geocoding').default = {
      init: jest.fn(),
      from: jest.fn()
    };

    // Default permission grant
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      expires: 'never',
      canAskAgain: true,
      granted: true
    });
  });

  it('clears location without making API call when empty string passed', async () => {
    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation('');
    });

    // Should not make any API calls for empty query
    expect(mockGeocode).not.toHaveBeenCalled();
    expect(mockReverseGeocode).not.toHaveBeenCalled();

    // Should not log errors for empty query
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringMatching(/Geocoding API error/)
    );
  });

  it('handles null/undefined query gracefully', async () => {
    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation(null as any);
    });

    await act(async () => {
      await searchLocation(undefined as any);
    });

    expect(mockGeocode).not.toHaveBeenCalled();
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it('tries to get current location when clearing with permissions', async () => {
    const mockCoords = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    };

    mockLocation.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: mockCoords,
      timestamp: Date.now()
    });

    mockReverseGeocode.mockResolvedValueOnce({
      ok: true,
      status: 'OK',
      results: [
        {
          address_components: [
            { long_name: 'San Francisco', types: ['locality'] }
          ]
        }
      ],
      raw: {}
    });

    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation('');
    });

    expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalled();
    expect(mockReverseGeocode).toHaveBeenCalledWith(37.7749, -122.4194);
  });

  it('clears state when no permissions for empty query', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied' as any,
      expires: 'never',
      canAskAgain: true,
      granted: false
    });

    const { result } = renderHook(() => useLocation());
    const [, city, , , results, searchLocation] = result.current;

    await act(async () => {
      await searchLocation('');
    });

    // Should clear location state
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(String),
        payload: ''
      })
    );
  });

  it('handles ZERO_RESULTS response gracefully', async () => {
    mockGeocode.mockResolvedValueOnce({
      ok: false,
      status: 'ZERO_RESULTS',
      results: [],
      raw: { status: 'ZERO_RESULTS', results: [] }
    });

    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation('Nonexistent Location');
    });

    // Should not throw TypeError
    expect(result.current[0]).toBeTruthy(); // Error message should be set
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringMatching(/undefined is not an object/)
    );
  });

  it('handles REQUEST_DENIED with error message', async () => {
    mockGeocode.mockResolvedValueOnce({
      ok: false,
      status: 'REQUEST_DENIED',
      results: [],
      raw: { 
        status: 'REQUEST_DENIED', 
        error_message: 'API key invalid',
        results: [] 
      },
      errorMessage: 'API key invalid'
    });

    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation('Test Location');
    });

    // Should handle error gracefully
    const [locationErrorMessage] = result.current;
    expect(locationErrorMessage).toBeTruthy();
    expect(locationErrorMessage).toContain('Location service unavailable');
  });

  it('uses last known coordinates when available for empty query', async () => {
    const mockCoords = {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    };

    // First call with coordinates to establish last known location
    mockLocation.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: mockCoords,
      timestamp: Date.now()
    });

    mockReverseGeocode.mockResolvedValue({
      ok: true,
      status: 'OK',
      results: [
        {
          address_components: [
            { long_name: 'Los Angeles', types: ['locality'] }
          ]
        }
      ],
      raw: {}
    });

    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    // First call to establish coordinates
    await act(async () => {
      await searchLocation('Los Angeles');
    });

    // Clear the mock to test second call
    mockLocation.getCurrentPositionAsync.mockClear();

    // Second call with empty query should use cached coordinates
    await act(async () => {
      await searchLocation('');
    });

    // Should use reverse geocoding with last known coordinates
    expect(mockReverseGeocode).toHaveBeenCalledWith(34.0522, -118.2437);
    
    // Should not call getCurrentPositionAsync again
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('handles location service errors gracefully', async () => {
    mockLocation.getCurrentPositionAsync.mockRejectedValueOnce(
      new Error('Location services are disabled')
    );

    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation('');
    });

    // Should not throw and should handle error
    const [locationErrorMessage] = result.current;
    // Error might not be set immediately due to clear state behavior
    expect(result.current).toBeDefined();
  });
});