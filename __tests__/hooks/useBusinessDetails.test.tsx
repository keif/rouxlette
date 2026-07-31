/**
 * Integration guard (I1): the Provider Adapter Layer introduced non-Yelp
 * (`osm:`) business ids. useBusinessDetails enriches basic search data via the
 * Yelp detail endpoint — but that endpoint carries the Yelp API key and only
 * knows Yelp entities. For an OSM business, hitting it always 404s while still
 * misrouting a key-bearing request to Yelp and burning rate limit.
 *
 * These tests lock in that Yelp detail enrichment is SKIPPED for non-Yelp ids
 * (basic data is kept, no network call), while the normal Yelp-id path still
 * enriches as before.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock the Yelp API so we can assert whether the detail endpoint is hit.
jest.mock('../../api/yelp', () => ({
  __esModule: true,
  getBusinessDetails: jest.fn(),
}));
import { getBusinessDetails } from '../../api/yelp';
import {
  useBusinessDetails,
  clearBusinessDetailsCache,
} from '../../hooks/useBusinessDetails';
import { BusinessProps } from '../../hooks/useResults';

const mockGetBusinessDetails = getBusinessDetails as jest.Mock;

const makeBusiness = (id: string): BusinessProps =>
  ({
    id,
    name: 'Test Spot',
    image_url: '',
    rating: 4,
    price: '$$',
    location: { city: 'Columbus', display_address: ['1 Main St'], address1: '1 Main St' },
    categories: [{ alias: 'coffee', title: 'Coffee' }],
    is_closed: false,
    coordinates: { latitude: 40, longitude: -83 },
    url: '',
    phone: '',
    display_phone: '',
    alias: 'test-spot',
    distance: 100,
    photos: [],
    review_count: 0,
    transactions: [],
    hours: [],
  } as unknown as BusinessProps);

describe('useBusinessDetails — non-Yelp provider guard (I1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Cache is module-level and persists across renders; reset between tests.
    clearBusinessDetailsCache();
  });

  it('does NOT call the Yelp detail endpoint for an osm: business, and keeps basic data', async () => {
    const osm = makeBusiness('osm:node/123');

    // autoFetch=true exercises the auto-fetch effect path used by the winner modal.
    const { result } = renderHook(() => useBusinessDetails(osm, true));

    // Let the auto-fetch effect settle before asserting it did nothing.
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetBusinessDetails).not.toHaveBeenCalled();
    // Basic business data is still exposed.
    expect(result.current.business.id).toBe('osm:node/123');
    expect(result.current.business.name).toBe('Test Spot');
    // Deliberate skip: not stuck loading.
    expect(result.current.loading).toBe(false);
  });

  it('does NOT call the Yelp detail endpoint when fetchDetails is invoked manually for an osm: business', async () => {
    const osm = makeBusiness('osm:way/456');

    const { result } = renderHook(() => useBusinessDetails(osm, false));

    await act(async () => {
      await result.current.fetchDetails();
    });

    expect(mockGetBusinessDetails).not.toHaveBeenCalled();
    expect(result.current.business.id).toBe('osm:way/456');
    expect(result.current.loading).toBe(false);
  });

  it('DOES call the Yelp detail endpoint for a normal Yelp id (existing behavior preserved)', async () => {
    mockGetBusinessDetails.mockResolvedValue({ photos: ['p1'], hours: [{ open: [] }] });
    const yelpBiz = makeBusiness('abc123');

    const { result } = renderHook(() => useBusinessDetails(yelpBiz, true));

    await waitFor(() => expect(mockGetBusinessDetails).toHaveBeenCalledWith('abc123'));
    await waitFor(() => expect(result.current.hasDetails).toBe(true));
  });
});
