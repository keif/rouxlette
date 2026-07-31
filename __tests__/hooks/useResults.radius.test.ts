/**
 * #55 — the distance slider's radiusMeters must reach the Yelp request, not
 * just the client-side filter. These tests exercise the REAL hooks (not a
 * reconstruction) so a regression to a hardcoded radius fails here.
 */
import { renderHook, act } from '@testing-library/react-native';
import useResults from '../../hooks/useResults';
import useResultsPersistence from '../../hooks/useResultsPersistence';
import yelp from '../../api/yelp';

// Mock the Yelp axios client so we can assert the request params. useResults now
// routes through the provider registry (Yelp primary), but the Yelp adapter still
// calls this client, so the param assertions below exercise the real path.
jest.mock('../../api/yelp', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

// Mock the Overpass client so the OSM fallback never touches the network. When
// Yelp returns an empty list the registry falls through to OSM; without this the
// suite would make a real Overpass request and hang.
jest.mock('../../api/overpass', () => ({
  __esModule: true,
  default: { post: jest.fn(async () => ({ data: { elements: [] } })) },
}));

// Cache-miss storage so searchApi always reaches the network path.
const mockStorage = {
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  getAllItems: jest.fn(() => []),
};
jest.mock('../../hooks/usePersistentStorage', () => ({
  __esModule: true,
  default: jest.fn(() => mockStorage),
}));

const mockedGet = yelp.get as jest.Mock;
const coords = { latitude: 39.9612, longitude: -82.9988 } as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.getItem.mockResolvedValue(null);
  mockedGet.mockResolvedValue({ status: 200, data: { businesses: [] } });
});

describe('useResults radius wiring (#55)', () => {
  it('sends the requested radiusMeters as the Yelp radius param', async () => {
    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('pizza', 'Columbus', coords, 8047);
    });
    expect(mockedGet).toHaveBeenCalledWith(
      '/businesses/search',
      expect.objectContaining({
        params: expect.objectContaining({ radius: 8047, latitude: coords.latitude }),
      })
    );
  });

  it('defaults to 1600 m when no radius is provided (back-compat)', async () => {
    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('pizza', 'Columbus', coords);
    });
    expect(mockedGet).toHaveBeenCalledWith(
      '/businesses/search',
      expect.objectContaining({
        params: expect.objectContaining({ radius: 1600 }),
      })
    );
  });

  it('sends radius on the location-string path too (no coords)', async () => {
    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('pizza', 'Columbus', null, 8047);
    });
    expect(mockedGet).toHaveBeenCalledWith(
      '/businesses/search',
      expect.objectContaining({
        params: expect.objectContaining({ location: 'Columbus', radius: 8047 }),
      })
    );
    // And it did NOT fall back to the coordinate branch.
    const call = mockedGet.mock.calls[0];
    expect(call[1].params.latitude).toBeUndefined();
  });

  it('clamps radius to the Yelp maximum of 40000 m', async () => {
    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('pizza', 'Columbus', coords, 99999);
    });
    const call = mockedGet.mock.calls.find(
      (c: any[]) => c[1]?.params?.radius !== undefined
    );
    expect(call).toBeTruthy();
    expect(call![1].params.radius).toBeLessThanOrEqual(40000);
  });
});

describe('useResults failure propagation (#58)', () => {
  // With the provider registry in place a single-provider failure is no longer a
  // hard error: the registry catches it and falls back to OSM. The #58 rethrow
  // now fires only when the search operation as a whole rejects (e.g. an
  // unexpected error inside the hook), which we cover via a registry-level throw
  // in useResults.providers.test.tsx. Here we assert the resilient behavior: a
  // Yelp outage degrades to the OSM fallback rather than rejecting.
  it('falls back to OSM when the Yelp request fails (no reject)', async () => {
    mockedGet.mockRejectedValueOnce(new Error('network down'));
    const overpass = require('../../api/overpass').default;
    overpass.post.mockResolvedValueOnce({ data: { elements: [] } });

    const { result } = renderHook(() => useResults());
    let out: any;
    await act(async () => {
      out = await result.current[2]('pizza', 'Columbus', coords, 1600);
    });
    // Yelp threw, OSM returned nothing → a valid (empty) result set, not a throw.
    expect(out).toEqual([]);
    expect(overpass.post).toHaveBeenCalled();
  });

  it('still resolves an empty array for a genuine no-results response', async () => {
    mockedGet.mockResolvedValueOnce({ status: 200, data: { businesses: [] } });
    const { result } = renderHook(() => useResults());
    let out: any;
    await act(async () => {
      out = await result.current[2]('pizza', 'Columbus', coords, 1600);
    });
    expect(out).toEqual([]);
  });
});

describe('generateCacheKey radius (#55)', () => {
  it('varies the cache key by radius so radii do not collide', () => {
    const { result } = renderHook(() => useResultsPersistence());
    const k1 = result.current.generateCacheKey('Columbus', 'pizza', coords, 1600);
    const k2 = result.current.generateCacheKey('Columbus', 'pizza', coords, 8047);
    expect(k1).not.toBe(k2);
  });

  it('is stable for the same radius', () => {
    const { result } = renderHook(() => useResultsPersistence());
    const k1 = result.current.generateCacheKey('Columbus', 'pizza', coords, 8047);
    const k2 = result.current.generateCacheKey('Columbus', 'pizza', coords, 8047);
    expect(k1).toBe(k2);
  });
});
