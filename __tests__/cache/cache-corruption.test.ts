import { renderHook, act } from '@testing-library/react-native';
import useResultsPersistence, { CACHE_VERSION } from '../../hooks/useResultsPersistence';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
};
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage
}));

// Mock persistent storage hook
jest.mock('../../hooks/usePersistentStorage', () => {
  return jest.fn(() => ({
    getItem: mockAsyncStorage.getItem,
    setItem: mockAsyncStorage.setItem,
    getAllItems: jest.fn(() => []),
  }));
});

describe('Cache Corruption Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect corrupted cache entries with MAX_DEPTH_EXCEEDED', async () => {
    const corruptedBusiness = {
      id: 'test-id',
      name: 'Test Restaurant',
      coordinates: { 
        latitude: '[MAX_DEPTH_EXCEEDED]', // Corrupted coordinate
        longitude: -83.0712 
      },
      categories: [],
      location: {},
      rating: 4.5,
    };

    mockAsyncStorage.getItem.mockResolvedValue([corruptedBusiness]);

    const { result } = renderHook(() => useResultsPersistence());

    let cachedResults;
    await act(async () => {
      cachedResults = await result.current.getCachedResults('Powell, OH', 'pizza');
    });

    // Should return null because the cache is corrupted
    expect(cachedResults).toBeNull();
  });

  it('should accept valid business data', async () => {
    const validBusiness = {
      id: 'test-id',
      name: 'Test Restaurant',
      coordinates: { 
        latitude: 40.1573,
        longitude: -83.0712 
      },
      categories: [],
      location: {},
      rating: 4.5,
    };

    mockAsyncStorage.getItem.mockResolvedValue([validBusiness]);

    const { result } = renderHook(() => useResultsPersistence());

    let cachedResults;
    await act(async () => {
      cachedResults = await result.current.getCachedResults('Powell, OH', 'pizza');
    });

    // Should return the valid business data
    expect(cachedResults).toEqual([validBusiness]);
  });

  it('should generate versioned cache keys', () => {
    const { result } = renderHook(() => useResultsPersistence());
    
    const cacheKey = result.current.generateCacheKey('Powell, OH', 'pizza');
    expect(cacheKey).toMatch(new RegExp(`^${CACHE_VERSION}:search:`));
  });

  it('should clear old unversioned cache keys in dev mode', async () => {
    const oldKeys = [
      'search:40.157,-83.071:pizza', // Old format
      'search:powell-oh:sushi',      // Old format
      'v2:search:40.157,-83.071:burgers', // New format - should not be removed
      'filters:saved',               // Non-search key - should not be removed
    ];

    mockAsyncStorage.getAllKeys.mockResolvedValue(oldKeys);
    
    const { result } = renderHook(() => useResultsPersistence());

    await act(async () => {
      await result.current.clearCorruptedCache();
    });

    // Should only remove old search keys
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
      'search:40.157,-83.071:pizza',
      'search:powell-oh:sushi'
    ]);
  });

  it('should detect string coordinates as corruption', async () => {
    const stringCoordsBusiness = {
      id: 'test-id',
      name: 'Test Restaurant',
      coordinates: { 
        latitude: '40.1573', // String instead of number
        longitude: -83.0712 
      },
      categories: [],
      location: {},
      rating: 4.5,
    };

    mockAsyncStorage.getItem.mockResolvedValue([stringCoordsBusiness]);

    const { result } = renderHook(() => useResultsPersistence());

    let cachedResults;
    await act(async () => {
      cachedResults = await result.current.getCachedResults('Powell, OH', 'pizza');
    });

    // Should return null because coordinates should be numbers
    expect(cachedResults).toBeNull();
  });

  it('should detect missing required fields as corruption', async () => {
    const incompleteBusiness = {
      id: 'test-id',
      // Missing name field
      coordinates: { 
        latitude: 40.1573,
        longitude: -83.0712 
      },
      categories: [],
      location: {},
      rating: 4.5,
    };

    mockAsyncStorage.getItem.mockResolvedValue([incompleteBusiness]);

    const { result } = renderHook(() => useResultsPersistence());

    let cachedResults;
    await act(async () => {
      cachedResults = await result.current.getCachedResults('Powell, OH', 'pizza');
    });

    // Should return null because name is required
    expect(cachedResults).toBeNull();
  });

  it('should handle mixed valid and invalid businesses', async () => {
    const validBusiness = {
      id: 'valid-id',
      name: 'Valid Restaurant',
      coordinates: { latitude: 40.1573, longitude: -83.0712 },
      categories: [], location: {}, rating: 4.5,
    };

    const corruptedBusiness = {
      id: 'corrupt-id',
      name: '[MAX_DEPTH_EXCEEDED]', // Corrupted name
      coordinates: { latitude: 40.1573, longitude: -83.0712 },
      categories: [], location: {}, rating: 4.5,
    };

    mockAsyncStorage.getItem.mockResolvedValue([validBusiness, corruptedBusiness]);

    const { result } = renderHook(() => useResultsPersistence());

    let cachedResults;
    await act(async () => {
      cachedResults = await result.current.getCachedResults('Powell, OH', 'pizza');
    });

    // Should return null because one business is corrupted
    expect(cachedResults).toBeNull();
  });
});