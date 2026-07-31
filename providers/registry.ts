import { logSafe } from '../utils/log';
import { ProviderSearchParams, RestaurantProvider, SearchOutcome } from './types';

/**
 * Fallback-only search: try providers in order; return the first non-empty
 * result. A provider that throws is logged and skipped. If every provider is
 * empty or throws, return an empty result set with the per-provider errors.
 */
export async function searchRestaurants(
  providers: RestaurantProvider[],
  params: ProviderSearchParams,
): Promise<SearchOutcome> {
  const errors: SearchOutcome['errors'] = {};
  let usedProvider: SearchOutcome['usedProvider'] = null;

  for (const provider of providers) {
    usedProvider = provider.id;
    try {
      const results = await provider.search(params);
      if (results.length > 0) {
        return { results, usedProvider, errors };
      }
    } catch (err: any) {
      errors[provider.id] = err?.message ?? String(err);
      logSafe('[providers] provider search failed', { providerId: provider.id, message: errors[provider.id] });
    }
  }
  return { results: [], usedProvider, errors };
}
