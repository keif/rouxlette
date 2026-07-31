import { BusinessProps, CoordinatesProps } from '../hooks/useResults';

export type ProviderId = 'yelp' | 'osm';

export interface ProviderSearchParams {
  term: string;
  coordinates: CoordinatesProps | null; // OSM requires this; Yelp prefers it
  locationLabel?: string;                // Yelp fallback when no coords
  radiusMeters: number;
  signal?: AbortSignal;
}

export interface RestaurantProvider {
  id: ProviderId;
  cachePolicy: 'cacheable' | 'no-store';
  search(params: ProviderSearchParams): Promise<BusinessProps[]>;
}

export interface SearchOutcome {
  results: BusinessProps[];
  usedProvider: ProviderId | null;
  errors: Partial<Record<ProviderId, string>>;
}
