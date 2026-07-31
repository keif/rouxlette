import yelp from '../api/yelp';
import { BusinessProps } from '../hooks/useResults';
import { ProviderSearchParams, RestaurantProvider } from './types';

// Mirrors the category filter used by the existing Yelp search in useResults so
// the provider stays behavior-compatible with today's request.
const YELP_CATEGORIES = 'restaurants,food,bars,cafes,bakeries,desserts,coffee';

/**
 * Yelp adapter for the RestaurantProvider interface.
 *
 * Wraps the existing `yelp.get('/businesses/search')` call, building the same
 * params (term, limit, categories, plus coordinates+radius OR location+radius)
 * and returning the raw `businesses` array. Closed/non-food filtering and
 * caching intentionally remain in useResults.
 */
export const yelpProvider: RestaurantProvider = {
  id: 'yelp',
  cachePolicy: 'cacheable',
  async search({
    term,
    coordinates,
    locationLabel,
    radiusMeters,
  }: ProviderSearchParams): Promise<BusinessProps[]> {
    const params: any = {
      term,
      limit: 50,
      categories: YELP_CATEGORIES,
    };

    if (coordinates?.latitude && coordinates?.longitude) {
      params.latitude = coordinates.latitude;
      params.longitude = coordinates.longitude;
      params.radius = radiusMeters;
    } else if (locationLabel && locationLabel.trim() !== '') {
      params.location = locationLabel;
      params.radius = radiusMeters;
    } else {
      return [];
    }

    const response = await yelp.get('/businesses/search', { params });
    const businesses = response?.data?.businesses;
    return Array.isArray(businesses) ? (businesses as BusinessProps[]) : [];
  },
};
