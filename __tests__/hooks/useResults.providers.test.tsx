/**
 * Task 5 — useResults must route both search paths through the provider
 * registry (Yelp primary, OSM fallback) and apply the closed/non-food
 * post-filter uniformly to whatever the used provider returned. Caching is
 * gated on the used provider's cachePolicy.
 */
import { renderHook, act } from '@testing-library/react-native';
import useResults from '../../hooks/useResults';

// Mock the registry so we assert useResults routes through it and applies the
// closed/non-food post-filter to the provider's raw results.
jest.mock('../../providers', () => ({
  __esModule: true,
  DEFAULT_PROVIDERS: [
    { id: 'yelp', cachePolicy: 'cacheable' },
    { id: 'osm', cachePolicy: 'cacheable' },
  ],
  searchRestaurants: jest.fn(),
}));
import { searchRestaurants } from '../../providers';
const mockSearch = searchRestaurants as jest.Mock;

// Cache-miss storage so the search always reaches the provider path.
const mockStorage = {
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  getAllItems: jest.fn(() => []),
};
jest.mock('../../hooks/usePersistentStorage', () => ({
  __esModule: true,
  default: jest.fn(() => mockStorage),
}));

const coords = { latitude: 40, longitude: -83 } as any;

const food = {
  id: 'osm:node/1',
  name: 'Cafe',
  categories: [{ alias: 'coffee', title: 'coffee' }],
  is_closed: false,
};
const closed = { id: 'y2', name: 'Closed', categories: [], is_closed: true };

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.getItem.mockResolvedValue(null);
  mockSearch.mockReset();
});

describe('useResults routes through the provider registry', () => {
  it('calls the registry and drops closed businesses (searchApi)', async () => {
    mockSearch.mockResolvedValue({ results: [food, closed], usedProvider: 'osm', errors: {} });

    const { result } = renderHook(() => useResults());
    let businesses: any;
    await act(async () => {
      businesses = await result.current[2]('coffee', 'Columbus', coords, 1600);
    });

    expect(mockSearch).toHaveBeenCalled();
    // Registry received the clamped radius and the coordinates.
    expect(mockSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ term: 'coffee', radiusMeters: 1600, coordinates: coords }),
    );
    expect(businesses.map((b: any) => b.id)).toEqual(['osm:node/1']); // closed dropped
  });

  it('drops non-food (blocked-category) businesses (searchApi)', async () => {
    const blocked = {
      id: 'y3',
      name: 'Body Shop',
      categories: [{ alias: 'autorepair', title: 'Auto Repair' }],
      is_closed: false,
    };
    mockSearch.mockResolvedValue({ results: [food, blocked], usedProvider: 'yelp', errors: {} });

    const { result } = renderHook(() => useResults());
    let businesses: any;
    await act(async () => {
      businesses = await result.current[2]('coffee', 'Columbus', coords, 1600);
    });

    expect(businesses.map((b: any) => b.id)).toEqual(['osm:node/1']); // blocked dropped
  });

  it('clamps radius to the Yelp maximum before calling the registry', async () => {
    mockSearch.mockResolvedValue({ results: [], usedProvider: 'osm', errors: {} });

    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('coffee', 'Columbus', coords, 99999);
    });

    const call = mockSearch.mock.calls[0];
    expect(call[1].radiusMeters).toBeLessThanOrEqual(40000);
  });

  it('routes searchApiWithResolver through the registry and drops closed', async () => {
    mockSearch.mockResolvedValue({ results: [food, closed], usedProvider: 'osm', errors: {} });

    const { result } = renderHook(() => useResults());
    let businesses: any;
    await act(async () => {
      businesses = await result.current[3](
        'coffee',
        { label: 'Columbus, OH', coords, source: 'geocode' } as any,
        1600,
      );
    });

    expect(mockSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ term: 'coffee', locationLabel: 'Columbus, OH', radiusMeters: 1600 }),
    );
    expect(businesses.map((b: any) => b.id)).toEqual(['osm:node/1']);
  });

  it('caches when the used provider is cacheable', async () => {
    mockSearch.mockResolvedValue({ results: [food], usedProvider: 'osm', errors: {} });

    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('coffee', 'Columbus', coords, 1600);
    });

    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('rethrows when the registry itself rejects, preserving #58 semantics', async () => {
    // A registry-level failure (not a single provider failing — the registry
    // absorbs those) must still propagate so callers can clear committed state.
    mockSearch.mockRejectedValue(new Error('registry down'));

    const { result } = renderHook(() => useResults());
    await act(async () => {
      await expect(result.current[2]('coffee', 'Columbus', coords, 1600)).rejects.toThrow('registry down');
    });
  });

  it('does not cache when the used provider is not in the cacheable set', async () => {
    // usedProvider is absent from DEFAULT_PROVIDERS, so the cache-policy lookup
    // resolves to undefined and caching is skipped.
    mockSearch.mockResolvedValue({ results: [food], usedProvider: 'unknown' as any, errors: {} });

    const { result } = renderHook(() => useResults());
    await act(async () => {
      await result.current[2]('coffee', 'Columbus', coords, 1600);
    });

    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });
});
