import { osmProvider } from '../osmProvider';

jest.mock('../../api/overpass', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
import overpass from '../../api/overpass';
const mockPost = (overpass as any).post as jest.Mock;

const coords = { latitude: 40.0, longitude: -83.0 };

describe('osmProvider', () => {
  beforeEach(() => mockPost.mockReset());

  it('maps Overpass elements to BusinessProps with unknown rating/price', async () => {
    mockPost.mockResolvedValue({ data: { elements: [
      { type: 'node', id: 1, lat: 40.001, lon: -83.001, tags: { name: 'Sushi Place', cuisine: 'sushi', opening_hours: 'Mo-Su 11:00-22:00', 'addr:city': 'Columbus' } },
      { type: 'node', id: 2, lat: 40.002, lon: -83.002, tags: { name: 'Curry House', cuisine: 'indian;vegetarian' } },
    ] } });

    const out = await osmProvider.search({ term: '', coordinates: coords, radiusMeters: 1600 });

    expect(out.map(b => b.id)).toEqual(['osm:node/1', 'osm:node/2']);
    expect(out[0].name).toBe('Sushi Place');
    expect(out[0].rating).toBe(0);
    expect(out[0].review_count).toBe(0);
    expect(out[0].price).toBe('');
    expect(out[0].is_closed).toBe(false);
    expect(out[0].categories.map(c => c.alias)).toContain('sushi');
    // 'indian' maps to canonical 'indpak'; unknown 'vegetarian' passes through
    expect(out[1].categories.map(c => c.alias)).toEqual(expect.arrayContaining(['indpak', 'vegetarian']));
    expect(out[0].distance).toBeGreaterThan(0);
  });

  it('drops elements without a name', async () => {
    mockPost.mockResolvedValue({ data: { elements: [ { type: 'node', id: 3, lat: 40, lon: -83, tags: { cuisine: 'pizza' } } ] } });
    const out = await osmProvider.search({ term: '', coordinates: coords, radiusMeters: 1600 });
    expect(out).toEqual([]);
  });

  it('filters by term against name/cuisine when a term is given', async () => {
    mockPost.mockResolvedValue({ data: { elements: [
      { type: 'node', id: 1, lat: 40, lon: -83, tags: { name: 'Pizza Palace', cuisine: 'pizza' } },
      { type: 'node', id: 2, lat: 40, lon: -83, tags: { name: 'Taco Town', cuisine: 'mexican' } },
    ] } });
    const out = await osmProvider.search({ term: 'pizza', coordinates: coords, radiusMeters: 1600 });
    expect(out.map(b => b.name)).toEqual(['Pizza Palace']);
  });

  it('returns [] when no coordinates are provided', async () => {
    const out = await osmProvider.search({ term: 'x', coordinates: null, radiusMeters: 1600 });
    expect(out).toEqual([]);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('maps way elements using center coordinates', async () => {
    mockPost.mockResolvedValue({ data: { elements: [
      { type: 'way', id: 9, center: { lat: 40.01, lon: -83.01 }, tags: { name: 'Big Bistro', cuisine: 'french' } },
    ] } });
    const out = await osmProvider.search({ term: '', coordinates: coords, radiusMeters: 1600 });
    expect(out[0].id).toBe('osm:way/9');
    expect(out[0].coordinates).toEqual({ latitude: 40.01, longitude: -83.01 });
  });

  it('is cacheable with id osm', () => {
    expect(osmProvider.id).toBe('osm');
    expect(osmProvider.cachePolicy).toBe('cacheable');
  });
});
