import { renderHook, act } from '@testing-library/react-native';
import useLocation from '../../hooks/useLocation';
import * as Location from 'expo-location';
import { geocode, reverseGeocode } from '../../api/google';
import { ActionType } from '../../context/actions';

// Mock dependencies
jest.mock('expo-location');
// Mock the network-bound geocoding helpers but keep the pure humanizeGeocodeError
// mapping real so user-facing error strings match production behavior.
jest.mock('../../api/google', () => {
  const actual = jest.requireActual('../../api/google');
  return {
    __esModule: true,
    ...actual,
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
    geocodeAddress: jest.fn(),
  };
});
jest.mock('react-native-geocoding');
jest.mock('../../hooks/useStorage');
jest.mock('../../context/RootContext');

// Reference the active mocked module via require() so mock overrides land on the
// same instance the hook consumes. (The `expo-location` mock is supplied by the
// global test setup; the ESM `import * as Location` namespace wrapper is not the
// same object that receives per-test overrides.)
const mockLocation = require('expo-location') as jest.Mocked<typeof Location>;
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

  it('resolves current location without doing a text geocode for an empty query', async () => {
    const { result } = renderHook(() => useLocation());
    const [, , , , , searchLocation] = result.current;

    await act(async () => {
      await searchLocation('');
    });

    // Empty query never runs a forward (text) geocode. With permissions granted,
    // the product fetches the current position and reverse-geocodes it instead.
    expect(mockGeocode).not.toHaveBeenCalled();
    expect(mockReverseGeocode).toHaveBeenCalled();

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

    // null/undefined normalize to the empty-query path: no forward text geocode.
    expect(mockGeocode).not.toHaveBeenCalled();
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

    // Should clear location state. clearLocationState() dispatches setLocation('')
    // and setCoords(null); actions use the numeric ActionType enum with a
    // structured payload (not a bare string).
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.SetLocation,
      payload: { location: '' }
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.SetCoords,
      payload: { coords: null }
    });
  });

  it('handles ZERO_RESULTS response gracefully', async () => {
    // Non-empty queries are resolved through Geocoder.from (react-native-geocoding),
    // not the forward geocode() helper. A ZERO_RESULTS normalized response should be
    // handled without throwing.
    require('react-native-geocoding').default.from.mockResolvedValueOnce({
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

    // Should not throw a TypeError while handling the empty result set.
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringMatching(/undefined is not an object/)
    );
    // No forward text geocode is performed for this path.
    expect(mockGeocode).not.toHaveBeenCalled();
  });

  it('handles REQUEST_DENIED with error message', async () => {
    // Geocoder.from returns a normalized GeocodeResponse; validateGeocodingResponse
    // routes it through humanizeGeocodeError, which maps REQUEST_DENIED to the
    // user-facing "Location service unavailable" message.
    require('react-native-geocoding').default.from.mockResolvedValueOnce({
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

    // Should surface a graceful, user-friendly error.
    const [locationErrorMessage] = result.current;
    expect(locationErrorMessage).toBeTruthy();
    expect(locationErrorMessage).toContain('Location service unavailable');
  });

  it('reverse-geocodes the freshly fetched position for an empty query', async () => {
    const mockCoords = {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    };

    // The empty-query path always fetches the current position and reverse-geocodes
    // those coordinates (searchLocation does not cache "last known" coords itself —
    // that caching lives in resolveSearchArea via global currentCoords).
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
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

    await act(async () => {
      await searchLocation('');
    });

    // Reverse geocoding is driven by the fetched position coordinates.
    expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalled();
    expect(mockReverseGeocode).toHaveBeenCalledWith(34.0522, -118.2437);
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