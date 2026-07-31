import { yelpProvider } from '../yelpProvider';

jest.mock('../../api/yelp', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
import yelp from '../../api/yelp';
const mockGet = (yelp as any).get as jest.Mock;

describe('yelpProvider', () => {
  beforeEach(() => mockGet.mockReset());

  it('searches by coordinates and returns businesses', async () => {
    mockGet.mockResolvedValue({ data: { businesses: [{ id: 'y1', name: 'A', categories: [] }] } });
    const out = await yelpProvider.search({
      term: 'pizza',
      coordinates: { latitude: 40, longitude: -83 },
      radiusMeters: 1600,
    });
    expect(out.map(b => b.id)).toEqual(['y1']);
    const [, opts] = mockGet.mock.calls[0];
    expect(opts.params.latitude).toBe(40);
    expect(opts.params.longitude).toBe(-83);
    expect(opts.params.radius).toBe(1600);
    expect(opts.params.term).toBe('pizza');
  });

  it('searches by location label when no coordinates', async () => {
    mockGet.mockResolvedValue({ data: { businesses: [] } });
    await yelpProvider.search({ term: 'tacos', coordinates: null, locationLabel: 'Columbus, OH', radiusMeters: 3000 });
    const [, opts] = mockGet.mock.calls[0];
    expect(opts.params.location).toBe('Columbus, OH');
    expect(opts.params.latitude).toBeUndefined();
  });

  it('returns [] when the response has no businesses array', async () => {
    mockGet.mockResolvedValue({ data: {} });
    const out = await yelpProvider.search({ term: 'x', coordinates: { latitude: 1, longitude: 2 }, radiusMeters: 1600 });
    expect(out).toEqual([]);
  });

  it('has cachePolicy cacheable and id yelp', () => {
    expect(yelpProvider.id).toBe('yelp');
    expect(yelpProvider.cachePolicy).toBe('cacheable');
  });
});
