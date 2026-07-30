# Restaurant Provider Adapter Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route restaurant search through a thin provider-adapter layer so Rouxlette can fall back from Yelp to a free OpenStreetMap source, without changing the reducer, Dealbreakers, or UI contracts.

**Architecture:** A `RestaurantProvider` interface (`search()` + `cachePolicy`) with a fallback-only registry (`searchRestaurants`). Yelp and OSM adapters both produce the existing `BusinessProps` shape (reused as the normalized type — no new type, no churn). `useResults` calls the registry instead of Yelp directly. OSM's missing rating/price are represented as `rating: 0` / `price: ''` (which already mean "unknown" in the Yelp-shaped world), and `applyFilters` is corrected so a price/rating filter never excludes a business merely for lacking that field.

**Tech Stack:** React Native + Expo, TypeScript, axios, jest-expo + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-07-30-provider-adapter-layer-design.md`

**Conventions:** yarn. Run tests with `yarn jest <path>`. Every task ends with `yarn jest` (full suite green) and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (**baseline 158 — must not increase**), then a commit.

**Implementation decisions locked here (spec left these to the plan):**
- **Bridge, don't unify:** reuse `BusinessProps` (from `hooks/useResults.ts`) as the normalized type. Adapters return `BusinessProps[]`.
- **Unknown fields:** OSM sets `rating: 0`, `review_count: 0`, `price: ''`, `hours: undefined`. These already read as "unknown" across the existing UI (`rating && …`, `price || '—'`, no-hours → openNow excludes).
- **Search params carry both coords and an optional location label** so both existing search functions route cleanly; OSM requires coords (returns `[]` without them).

## File structure

- `providers/types.ts` — `ProviderId`, `RestaurantProvider`, `ProviderSearchParams`, `SearchOutcome`.
- `providers/registry.ts` — `searchRestaurants(providers, params)` fallback logic + `DEFAULT_PROVIDERS`.
- `providers/yelpProvider.ts` — Yelp adapter (wraps `api/yelp.ts`).
- `providers/osmProvider.ts` — OSM adapter (Overpass) + cuisine→alias map + haversine.
- `api/overpass.ts` — axios client for the Overpass endpoint (mockable, mirrors `api/yelp.ts`).
- `utils/filterBusinesses.ts` — correct price/rating filters for missing data.
- `hooks/useResults.ts` — route both search functions through the registry; cache-policy gate; expose `usedProvider`.
- `components/shared/ProviderAttribution.tsx` — "© OpenStreetMap contributors" when OSM results are shown.
- Tests alongside each.

---

### Task 1: Provider types + fallback registry

**Files:**
- Create: `providers/types.ts`
- Create: `providers/registry.ts`
- Test: `providers/__tests__/registry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `providers/__tests__/registry.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest providers/__tests__/registry.test.ts` → FAIL (modules don't exist).

- [ ] **Step 3: Implement types**

Create `providers/types.ts`:
```ts
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
```

- [ ] **Step 4: Implement the registry**

Create `providers/registry.ts`:
```ts
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
```
(`DEFAULT_PROVIDERS` is added in Task 5 once both adapters exist, to avoid an import cycle before they're built.)

- [ ] **Step 5: Run to verify it passes**

Run: `yarn jest providers/__tests__/registry.test.ts` → PASS.

- [ ] **Step 6: Full suite + typecheck + commit**

Run `yarn jest` (green) and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (≤158).
```bash
git add providers/types.ts providers/registry.ts providers/__tests__/registry.test.ts
git commit -m "feat(providers): provider interface + fallback-only search registry"
```

---

### Task 2: Yelp provider adapter

**Files:**
- Create: `providers/yelpProvider.ts`
- Test: `providers/__tests__/yelpProvider.test.ts`

Extract the Yelp request from `useResults` into an adapter. It builds the same params (`term`, `limit: 50`, `categories: 'restaurants,food,bars,cafes,bakeries,desserts,coffee'`, plus coords+radius OR location+radius), calls `yelp.get('/businesses/search')`, and returns `response.data.businesses` as `BusinessProps[]` (the Yelp JSON already matches `BusinessProps`). It does NOT filter closed/non-food or cache — those stay in `useResults` and apply to all providers.

- [ ] **Step 1: Write the failing test**

Create `providers/__tests__/yelpProvider.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest providers/__tests__/yelpProvider.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Create `providers/yelpProvider.ts`:
```ts
import yelp from '../api/yelp';
import { BusinessProps } from '../hooks/useResults';
import { ProviderSearchParams, RestaurantProvider } from './types';

const YELP_CATEGORIES = 'restaurants,food,bars,cafes,bakeries,desserts,coffee';

export const yelpProvider: RestaurantProvider = {
  id: 'yelp',
  cachePolicy: 'cacheable',
  async search({ term, coordinates, locationLabel, radiusMeters }: ProviderSearchParams): Promise<BusinessProps[]> {
    const params: any = { term, limit: 50, categories: YELP_CATEGORIES, radius: radiusMeters };
    if (coordinates?.latitude && coordinates?.longitude) {
      params.latitude = coordinates.latitude;
      params.longitude = coordinates.longitude;
    } else if (locationLabel && locationLabel.trim() !== '') {
      params.location = locationLabel;
    } else {
      return [];
    }
    const response = await yelp.get('/businesses/search', { params });
    const businesses = response?.data?.businesses;
    return Array.isArray(businesses) ? (businesses as BusinessProps[]) : [];
  },
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn jest providers/__tests__/yelpProvider.test.ts` → PASS.

- [ ] **Step 5: Full suite + typecheck + commit**

```bash
git add providers/yelpProvider.ts providers/__tests__/yelpProvider.test.ts
git commit -m "feat(providers): Yelp adapter behind the provider interface"
```

---

### Task 3: OSM (Overpass) provider adapter

**Files:**
- Create: `api/overpass.ts`
- Create: `providers/osmCuisineMap.ts`
- Create: `providers/osmProvider.ts`
- Test: `providers/__tests__/osmProvider.test.ts`

- [ ] **Step 1: Write the failing test**

Create `providers/__tests__/osmProvider.test.ts`:
```ts
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

  it('is cacheable with id osm', () => {
    expect(osmProvider.id).toBe('osm');
    expect(osmProvider.cachePolicy).toBe('cacheable');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest providers/__tests__/osmProvider.test.ts` → FAIL.

- [ ] **Step 3: Implement the Overpass client**

Create `api/overpass.ts` (mirrors `api/yelp.ts` structure; endpoint configurable):
```ts
import axios from 'axios';

// Public Overpass endpoint. Configurable so it can be swapped or self-hosted.
// Overpass requires an identifying User-Agent/Referer.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const overpass = axios.create({
  baseURL: OVERPASS_URL,
  headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Rouxlette/1.0 (https://github.com/keif/rouxlette)' },
  timeout: 15000,
});

export default overpass;
```

- [ ] **Step 4: Implement the cuisine map**

Create `providers/osmCuisineMap.ts`:
```ts
// Maps common OSM `cuisine=*` values into the canonical (Yelp-style) alias space
// used by COMMON_CUISINES and the Dealbreakers filter. Unknown values pass
// through lowercased so they still display (they just won't match a curated chip).
const OSM_CUISINE_TO_ALIAS: Record<string, string> = {
  indian: 'indpak',
  sushi: 'sushi',
  japanese: 'japanese',
  pizza: 'pizza',
  italian: 'italian',
  mexican: 'mexican',
  chinese: 'chinese',
  thai: 'thai',
  burger: 'burgers',
  seafood: 'seafood',
  vegan: 'vegan',
  american: 'tradamerican',
  coffee_shop: 'coffee',
};

export function mapCuisineToAliases(cuisine: string | undefined): string[] {
  if (!cuisine) return [];
  return cuisine
    .split(';')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean)
    .map(c => OSM_CUISINE_TO_ALIAS[c] ?? c);
}
```

- [ ] **Step 5: Implement the OSM provider**

Create `providers/osmProvider.ts`:
```ts
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
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
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
      if (!name) continue; // unnamed POIs aren't useful to show

      const pos = elementCoords(el);
      if (!pos) continue;

      const aliases = mapCuisineToAliases(tags.cuisine);

      if (q) {
        const haystack = `${name} ${tags.cuisine || ''}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }

      businesses.push({
        id: `osm:${el.type}/${el.id}`,
        alias: '',
        name,
        coordinates: { latitude: pos.lat, longitude: pos.lon },
        categories: aliases.map(a => ({ alias: a, title: a })),
        rating: 0,          // unknown (OSM has no crowd rating)
        review_count: 0,
        price: '',          // unknown (OSM has no price level)
        hours: undefined,   // unknown; openNow filter will exclude (see filter task)
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
```

- [ ] **Step 6: Run to verify it passes**

Run: `yarn jest providers/__tests__/osmProvider.test.ts` → PASS.

- [ ] **Step 7: Full suite + typecheck + commit**

```bash
git add api/overpass.ts providers/osmCuisineMap.ts providers/osmProvider.ts providers/__tests__/osmProvider.test.ts
git commit -m "feat(providers): OpenStreetMap (Overpass) adapter with cuisine-alias mapping"
```

---

### Task 4: Graceful price/rating filtering for missing data

**Files:**
- Modify: `utils/filterBusinesses.ts`
- Test: `utils/__tests__/filterBusinesses.test.ts` (or wherever its tests live — check first; if none, create this path)

Per the approved decision, a price or rating filter must exclude a business only when it HAS a value that fails the filter — never for lacking the field. Today the code excludes missing values (`if (!business.price) return false;` and `if (!business.rating || …) return false;`), which would nuke every OSM result whenever those filters are on.

- [ ] **Step 1: Write the failing test**

First check for an existing test file: `ls utils/__tests__ 2>/dev/null; grep -rl "applyFilters" __tests__ utils 2>/dev/null`. Add these cases to the existing `applyFilters` test file (or create `utils/__tests__/filterBusinesses.test.ts` importing `applyFilters` from `../filterBusinesses` and `initialAppState` filters as a base). Use a base `filters` object matching `Filters` (spread from `initialAppState.filters` if imported, or construct: `{ categoryIds: [], excludedCategoryIds: [], priceLevels: [], openNow: false, radiusMeters: 40000, minRating: 0 }`).
```ts
const base = { categoryIds: [], excludedCategoryIds: [], priceLevels: [], openNow: false, radiusMeters: 40000, minRating: 0 } as any;
const biz = (over: any) => ({ id: 'x', name: 'x', categories: [], distance: 100, price: '', rating: 0, is_closed: false, ...over } as any);

describe('applyFilters — missing data is not excluded (#providers)', () => {
  it('keeps a business with unknown price when a price filter is active', () => {
    const out = applyFilters([biz({ price: '' })], { ...base, priceLevels: [2] });
    expect(out).toHaveLength(1);
  });
  it('still excludes a business whose known price is not selected', () => {
    const out = applyFilters([biz({ price: '$$$$' })], { ...base, priceLevels: [1] });
    expect(out).toHaveLength(0);
  });
  it('keeps a business with unknown rating when a minRating filter is active', () => {
    const out = applyFilters([biz({ rating: 0 })], { ...base, minRating: 4 });
    expect(out).toHaveLength(1);
  });
  it('still excludes a business whose known rating is below minRating', () => {
    const out = applyFilters([biz({ rating: 3 })], { ...base, minRating: 4 });
    expect(out).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest -t "missing data is not excluded"` → the two "keeps … unknown" cases FAIL (current code excludes them).

- [ ] **Step 3: Fix `applyFilters`**

In `utils/filterBusinesses.ts`, replace the price block:
```ts
    // Price filter — only exclude a business that HAS a price not in the
    // selected levels. Unknown price (e.g. OSM) passes (#providers).
    if (filters.priceLevels.length > 0 && business.price) {
      const businessPriceLevel = business.price.length as 1 | 2 | 3 | 4;
      if (!filters.priceLevels.includes(businessPriceLevel)) {
        return false;
      }
    }
```
and replace the minimum-rating block:
```ts
    // Minimum rating filter — only exclude a business that HAS a rating below
    // the threshold. Unknown rating (0 / null, e.g. OSM) passes (#providers).
    if (filters.minRating > 0 && business.rating && business.rating < filters.minRating) {
      return false;
    }
```

- [ ] **Step 4: Run to verify it passes + check no regressions**

Run: `yarn jest utils` (and any suite that imports `applyFilters`). If an EXISTING test asserted the old "exclude missing price/rating" behavior, update it to match the new intent and note it in the commit. Expected: all green.

- [ ] **Step 5: Full suite + typecheck + commit**

```bash
git add utils/filterBusinesses.ts utils/__tests__/filterBusinesses.test.ts
git commit -m "fix(filter): don't exclude businesses for missing price/rating (multi-provider)"
```

---

### Task 5: Route `useResults` through the registry

**Files:**
- Modify: `hooks/useResults.ts`
- Create: `providers/index.ts` (exports `DEFAULT_PROVIDERS`)
- Test: `__tests__/hooks/useResults.providers.test.tsx` (new)

Replace the inline `yelp.get('/businesses/search')` block in BOTH `searchApi` and `searchApiWithResolver` with a registry call. Keep the existing closed/non-food post-filter (`is_closed`, `hasBlockedCategory`) — now applied uniformly to whatever provider returned. Cache only when the used provider is `cacheable`.

- [ ] **Step 1: Add the default provider list**

Create `providers/index.ts`:
```ts
import { RestaurantProvider } from './types';
import { yelpProvider } from './yelpProvider';
import { osmProvider } from './osmProvider';

// Priority order: Yelp primary, OpenStreetMap fallback.
export const DEFAULT_PROVIDERS: RestaurantProvider[] = [yelpProvider, osmProvider];

export { searchRestaurants } from './registry';
export * from './types';
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/hooks/useResults.providers.test.tsx`. Mock the registry so we assert `useResults` routes through it and applies the closed/non-food post-filter. Render a harness that calls `searchApi` and inspect the returned businesses.
```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import useResults from '../../hooks/useResults';

jest.mock('../../providers', () => ({
  DEFAULT_PROVIDERS: [{ id: 'yelp' }, { id: 'osm' }],
  searchRestaurants: jest.fn(),
}));
import { searchRestaurants } from '../../providers';
const mockSearch = searchRestaurants as jest.Mock;

// Neutralize persistence so no real cache/AsyncStorage runs.
jest.mock('../../hooks/useResultsPersistence', () => ({
  __esModule: true,
  default: () => ({
    getCachedResults: jest.fn().mockResolvedValue(null),
    cacheResults: jest.fn().mockResolvedValue(undefined),
    generateCacheKey: jest.fn().mockReturnValue('k'),
    getCachedResultsByKey: jest.fn().mockResolvedValue(null),
    cacheResultsByKey: jest.fn().mockResolvedValue(undefined),
    clearOldCache: jest.fn(),
  }),
}));

let api: ReturnType<typeof useResults>;
function Harness() { api = useResults(); return null; }

const food = { id: 'osm:node/1', name: 'Cafe', categories: [{ alias: 'coffee', title: 'coffee' }], is_closed: false };
const closed = { id: 'y2', name: 'Closed', categories: [], is_closed: true };

describe('useResults routes through the provider registry', () => {
  beforeEach(() => mockSearch.mockReset());

  it('calls the registry and drops closed businesses', async () => {
    mockSearch.mockResolvedValue({ results: [food, closed], usedProvider: 'osm', errors: {} });
    render(<Harness />);
    const businesses = await api[2]('coffee', 'Columbus', { latitude: 40, longitude: -83 } as any, 1600);
    expect(mockSearch).toHaveBeenCalled();
    expect(businesses.map((b: any) => b.id)).toEqual(['osm:node/1']); // closed dropped
  });
});
```
NOTE: adapt indices (`api[2]` = `searchApi` per the `return [...] as const` order) and the harness to how the existing `useResults` tests render/consume the hook — check `__tests__/hooks/` for the established pattern and match it (some suites call the returned functions directly, some wrap in a component).

- [ ] **Step 3: Run to verify it fails**

Run: `yarn jest __tests__/hooks/useResults.providers.test.tsx` → FAIL (still calls `yelp.get`, not the registry).

- [ ] **Step 4: Refactor `useResults`**

In `hooks/useResults.ts`:
1. Replace the `import yelp from "../api/yelp";` usage for search with:
```ts
import { DEFAULT_PROVIDERS, searchRestaurants } from '../providers';
```
2. Extract the shared post-processing into a helper (top of the hook module or inside the component):
```ts
function keepFoodAndOpen(businesses: BusinessProps[]): BusinessProps[] {
  return businesses.filter(business => {
    if (business.is_closed) return false;
    const categoryAliases = business.categories?.map(c => c.alias) || [];
    if (hasBlockedCategory(categoryAliases)) return false;
    return true;
  });
}
```
3. In `searchApi`, replace the block from `const response: AxiosResponse = await yelp.get(...)` through the `if (response.data && response.data.businesses) { … } else { … }` with:
```ts
        const outcome = await searchRestaurants(DEFAULT_PROVIDERS, {
          term: searchTerm,
          coordinates: coords?.latitude && coords?.longitude ? coords : null,
          locationLabel: location,
          radiusMeters: radius,
        });
        const filteredBusinesses = keepFoodAndOpen(outcome.results);
        const finalResults: ResultsProps = { id: uuid(), businesses: filteredBusinesses };

        const usedCacheable = DEFAULT_PROVIDERS.find(p => p.id === outcome.usedProvider)?.cachePolicy === 'cacheable';
        if (usedCacheable) {
          await resultsPersistence.cacheResults(location, searchTerm, filteredBusinesses, coords, radius);
        }
        setResults(finalResults);
        return filteredBusinesses;
```
4. In `searchApiWithResolver`, replace the equivalent `yelp.get(...)` block with:
```ts
        const outcome = await searchRestaurants(DEFAULT_PROVIDERS, {
          term: searchTerm,
          coordinates: resolvedLocation.coords?.latitude && resolvedLocation.coords?.longitude ? resolvedLocation.coords : null,
          locationLabel: resolvedLocation.label,
          radiusMeters: radius,
        });
        const filteredBusinesses = keepFoodAndOpen(outcome.results);
        const finalResults: ResultsProps = { id: uuid(), businesses: filteredBusinesses };

        const usedCacheable = DEFAULT_PROVIDERS.find(p => p.id === outcome.usedProvider)?.cachePolicy === 'cacheable';
        if (usedCacheable) {
          await resultsPersistence.cacheResultsByKey(cacheKey, filteredBusinesses);
        }
        setResults(finalResults);
        return filteredBusinesses;
```
5. Remove the now-unused `AxiosResponse`/`logNetwork`/`yelp` imports if nothing else uses them (grep the file; leave anything still referenced). Keep the try/catch error handling and the cache-read blocks unchanged.

- [ ] **Step 5: Run to verify it passes**

Run: `yarn jest __tests__/hooks/useResults.providers.test.tsx` and the existing useResults suites → PASS. Fix any existing useResults test that mocked `api/yelp` directly (it now goes through the registry — either mock `../../providers` there too, or leave Yelp mocked since the real registry calls the real yelpProvider which calls the mocked `api/yelp`; prefer the latter for existing tests so they exercise the real path).

- [ ] **Step 6: Full suite + typecheck + commit**

Run `yarn jest` (all green) and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (≤158).
```bash
git add hooks/useResults.ts providers/index.ts __tests__/hooks/useResults.providers.test.tsx
git commit -m "feat(providers): route useResults through the provider registry with cache-policy gate"
```

---

### Task 6: OpenStreetMap attribution in the UI

**Files:**
- Create: `components/shared/ProviderAttribution.tsx`
- Modify: the results list header (Search results) — `screens/SearchScreen.tsx` (confirm the header component it renders)
- Test: `components/shared/__tests__/ProviderAttribution.test.tsx`

ODbL requires "© OpenStreetMap contributors" attribution when OSM data is displayed. Show it whenever any visible business came from OSM (id starts with `osm:`). Yelp attribution behavior is unchanged.

- [ ] **Step 1: Write the failing test**

Create `components/shared/__tests__/ProviderAttribution.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProviderAttribution } from '../ProviderAttribution';

describe('ProviderAttribution', () => {
  it('shows OSM attribution when an osm business is present', () => {
    const { getByText } = render(
      <ProviderAttribution businesses={[{ id: 'osm:node/1' } as any, { id: 'y1' } as any]} />
    );
    expect(getByText(/OpenStreetMap/)).toBeTruthy();
  });
  it('renders nothing when no osm businesses are present', () => {
    const { queryByText } = render(
      <ProviderAttribution businesses={[{ id: 'y1' } as any]} />
    );
    expect(queryByText(/OpenStreetMap/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest components/shared/__tests__/ProviderAttribution.test.tsx` → FAIL.

- [ ] **Step 3: Implement**

Create `components/shared/ProviderAttribution.tsx`:
```tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BusinessProps } from '../../hooks/useResults';
import { supperClub } from '../../theme/supperClub';

export const ProviderAttribution: React.FC<{ businesses: BusinessProps[] }> = ({ businesses }) => {
  const hasOsm = businesses.some(b => typeof b.id === 'string' && b.id.startsWith('osm:'));
  if (!hasOsm) return null;
  return <Text style={styles.text}>Data © OpenStreetMap contributors</Text>;
};

const styles = StyleSheet.create({
  text: { fontSize: 11, color: supperClub.textMuted, textAlign: 'center', paddingVertical: 8 },
});

export default ProviderAttribution;
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn jest components/shared/__tests__/ProviderAttribution.test.tsx` → PASS.

- [ ] **Step 5: Render it in the Search results**

In `screens/SearchScreen.tsx`, render `<ProviderAttribution businesses={state.results} />` in the results list footer (e.g. `ListFooterComponent`, or after the list). Import it. Keep it out of the empty state. Verify by reading the current results-list JSX and placing it where a footer naturally fits.

- [ ] **Step 6: Full suite + typecheck + commit**

Run `yarn jest` (green) and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (≤158).
```bash
git add components/shared/ProviderAttribution.tsx components/shared/__tests__/ProviderAttribution.test.tsx screens/SearchScreen.tsx
git commit -m "feat(providers): show OpenStreetMap attribution when OSM results are displayed"
```

---

## Self-review notes (author checklist — applied)

- **Spec coverage:** provider interface + `cachePolicy` (T1), registry fallback-only (T1), Yelp adapter (T2), OSM adapter + cuisine→alias normalization + reuse-coords/skip-Nominatim (T3), graceful missing-field filtering (T4), `useResults` integration + cache-policy gate (T5), OSM attribution (T6). Category-alias tie to Dealbreakers preserved (OSM aliases flow into the same `categories[].alias` the reducer filters on).
- **Decisions honored:** fallback-only (T1/T5), OSM missing rating/price shown gracefully (T3 sets `0`/`''`; T4 stops filters excluding them), abstraction-layer-only scope (no bulk base, no premium providers — out of scope in spec).
- **No type churn:** `BusinessProps` reused as the normalized type; OSM fills all required fields with sensible empties — keeps tsc at the 158 baseline (verified each task).
- **Placeholders:** none — every step has literal test + impl code. Two steps say "match the existing test/JSX pattern" (useResults harness in T5, results footer in T6) because those depend on current file structure the implementer must read; the required behavior and code are fully specified.
- **Type consistency:** `ProviderSearchParams` (`coordinates | null`, `locationLabel?`), `RestaurantProvider.search → BusinessProps[]`, `SearchOutcome { results, usedProvider, errors }`, `id` namespaced `osm:<type>/<id>` — used consistently T1→T6.

## Post-implementation

- Run full suite + `tsc`, then ship via branch → PR → `/codex review` gate → squash-merge (repo CLAUDE.md). Pure JS/TS — OTA-deliverable.
- Follow-ups (documented out-of-scope): confirm Yelp's current free-tier; consider a real `opening_hours` parser so OSM places aren't dropped by the "open now" filter; later, the hybrid static base and premium detail providers using the `cachePolicy: 'no-store'` hook.
