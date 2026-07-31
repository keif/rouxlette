import { RestaurantProvider } from './types';
import { yelpProvider } from './yelpProvider';
import { osmProvider } from './osmProvider';

// Priority order: Yelp primary, OpenStreetMap fallback.
export const DEFAULT_PROVIDERS: RestaurantProvider[] = [yelpProvider, osmProvider];

export { searchRestaurants } from './registry';
export * from './types';
