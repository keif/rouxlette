import { searchRestaurants } from '../registry';
import { RestaurantProvider, ProviderSearchParams } from '../types';

const params: ProviderSearchParams = {
  term: 'pizza',
  coordinates: { latitude: 40, longitude: -83 },
  radiusMeters: 1600,
};
const biz = (id: string) => ({ id, name: id, categories: [] } as any);

const provider = (id: any, impl: () => Promise<any[]>): RestaurantProvider =>
  ({ id, cachePolicy: 'cacheable', search: impl });

describe('searchRestaurants (fallback-only)', () => {
  it('returns the primary provider results and does not call the fallback', async () => {
    const osm = jest.fn().mockResolvedValue([biz('o1')]);
    const out = await searchRestaurants(
      [provider('yelp', () => Promise.resolve([biz('y1')])), provider('osm', osm)],
      params,
    );
    expect(out.results.map(b => b.id)).toEqual(['y1']);
    expect(out.usedProvider).toBe('yelp');
    expect(osm).not.toHaveBeenCalled();
  });

  it('falls back when the primary throws', async () => {
    const out = await searchRestaurants(
      [provider('yelp', () => Promise.reject(new Error('boom'))), provider('osm', () => Promise.resolve([biz('o1')]))],
      params,
    );
    expect(out.results.map(b => b.id)).toEqual(['o1']);
    expect(out.usedProvider).toBe('osm');
    expect(out.errors.yelp).toContain('boom');
  });

  it('falls back when the primary returns empty', async () => {
    const out = await searchRestaurants(
      [provider('yelp', () => Promise.resolve([])), provider('osm', () => Promise.resolve([biz('o1')]))],
      params,
    );
    expect(out.usedProvider).toBe('osm');
    expect(out.results.map(b => b.id)).toEqual(['o1']);
  });

  it('returns empty with errors when all providers fail or are empty', async () => {
    const out = await searchRestaurants(
      [provider('yelp', () => Promise.reject(new Error('x'))), provider('osm', () => Promise.resolve([]))],
      params,
    );
    expect(out.results).toEqual([]);
    expect(out.usedProvider).toBe('osm'); // last attempted
    expect(out.errors.yelp).toContain('x');
  });
});
