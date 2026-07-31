import overpass from '../api/overpass';
import { BusinessProps, CoordinatesProps } from '../hooks/useResults';
import { ProviderSearchParams, RestaurantProvider } from './types';
import { mapCuisineToAliases } from './osmCuisineMap';

function haversineMeters(a: CoordinatesProps, lat: number, lon: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat - a.latitude);
  const dLon = toRad(lon - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function buildQuery(coords: CoordinatesProps, radiusMeters: number): string {
  const around = `(around:${radiusMeters},${coords.latitude},${coords.longitude})`;
  return `[out:json][timeout:25];(node["amenity"="restaurant"]${around};way["amenity"="restaurant"]${around};);out center 50;`;
}

function elementCoords(el: any): { lat: number; lon: number } | null {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') return { lat: el.lat, lon: el.lon };
  // Guard the way `center` the same way as the node branch: Overpass can return
  // a way with a center object that has missing/non-numeric lat/lon (unresolved
  // geometry). Returning null there drops the element instead of leaking NaN
  // coordinates (and a NaN distance) into a BusinessProps.
  if (el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number')
    return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

export const osmProvider: RestaurantProvider = {
  id: 'osm',
  cachePolicy: 'cacheable',
  async search({ term, coordinates, radiusMeters, signal }: ProviderSearchParams): Promise<BusinessProps[]> {
    if (!coordinates?.latitude || !coordinates?.longitude) return [];

    const response = await overpass.post('', buildQuery(coordinates, radiusMeters), { signal });
    const elements: any[] = Array.isArray(response?.data?.elements) ? response.data.elements : [];
    const q = term.trim().toLowerCase();

    const businesses: BusinessProps[] = [];
    for (const el of elements) {
      const tags = el.tags || {};
      const name: string = tags.name;
      if (!name) continue;

      const pos = elementCoords(el);
      if (!pos) continue;

      const aliases = mapCuisineToAliases(tags.cuisine);

      if (q) {
        // Term filter matches the RAW OSM `cuisine` value + name, not the mapped
        // canonical aliases (e.g. searching "indpak" won't match `cuisine=indian`).
        const haystack = `${name} ${tags.cuisine || ''}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }

      businesses.push({
        id: `osm:${el.type}/${el.id}`,
        alias: '',
        name,
        coordinates: { latitude: pos.lat, longitude: pos.lon },
        categories: aliases.map(a => ({ alias: a, title: a })),
        rating: 0,
        review_count: 0,
        price: '',
        hours: undefined,
        is_closed: false,
        distance: haversineMeters(coordinates, pos.lat, pos.lon),
        display_phone: tags.phone || '',
        phone: tags.phone || '',
        image_url: '',
        photos: [],
        transactions: [],
        url: '',
        location: {
          address1: tags['addr:street'] || '',
          address2: null,
          address3: '',
          city: tags['addr:city'] || '',
          country: tags['addr:country'] || '',
          display_address: [tags['addr:street'], tags['addr:city']].filter(Boolean) as string[],
          state: tags['addr:state'] || '',
          zip_code: tags['addr:postcode'] || '',
        },
      });
    }
    return businesses;
  },
};
