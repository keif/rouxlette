# Restaurant Provider Adapter Layer — design

**Date:** 2026-07-30
**Status:** Design approved, pending spec review

## Goal

Stop being beholden to a single restaurant data source. Introduce a thin
**provider-adapter layer** so Rouxlette can search across multiple restaurant/POI
data sources behind one normalized interface, starting with the existing **Yelp**
client plus a free **OpenStreetMap** fallback. Keep it cheap (this is a
non-commercial project), keep callers (the reducer, Dealbreakers, UI) unchanged,
and make adding future providers a drop-in.

Scope for this spec is the **abstraction layer only**. The hybrid bulk-data base
and premium detail providers are documented as future work, not built here.

## Background: why now, and what the research said

A 2026 pricing/terms review of the major sources produced one decisive finding:
**no free source carries hours + rating + price together.**

- **Free bulk datasets** — Foursquare OS Places (Apache-2.0, ~109M POIs) and
  Overture Maps (permissive, ~2,300-term taxonomy) — have excellent category data
  but **no hours, rating, or price**.
- **OpenStreetMap** (Overpass API, free, no key) has `cuisine=*` and
  `opening_hours=*` but **no crowd rating or price level**. Nominatim geocoding is
  capped at ~1 req/s.
- **Google Places (New)** has everything, but rating/price/hours push every search
  to the Enterprise SKU (~$35 / 1,000 calls), it **requires a billing card**, and
  its ToS **prohibits caching Places results** — which conflicts with Rouxlette's
  existing AsyncStorage cache.
- **Foursquare Places (live)** returns the needed fields only on Premium
  (~$18.75 / 1,000 from day one; 500 free Pro calls/mo don't cover Premium fields).
- **Apple Maps Server API** returns no rating/price/hours (disqualified on data),
  and needs the paid Apple Developer membership.
- **TripAdvisor** has no non-commercial license tier and is being sunset for a new
  platform in 2026 (avoid).
- **Yelp** (incumbent) provides categories + rating + price + hours in one call, but
  tightened its Fusion free tier in 2025. (Yelp's *current* exact free-tier limits
  were not confirmed in this pass — see Open Questions.)

Implication for architecture: the cheapest robust path over time is a **hybrid**
(free bulk data for static/category fields, one live API called sparingly for
dynamic fields). We are **not** building the hybrid now, but the interface is
designed so it can slot in without breaking callers. For today, Yelp remains the
rich primary and OSM is a genuinely-free fallback.

## Decisions (locked)

1. **Scope:** abstraction layer only. Hybrid static base and premium providers are
   future adapters, documented not built.
2. **Providers implemented now:** `yelp` (wrap the existing client) and `osm`
   (new, OpenStreetMap via Overpass).
3. **Combination mode:** **fallback only** — Yelp is primary; OSM is queried only
   when Yelp errors or returns empty. No cross-provider dedupe/merge in this cut.
4. **Missing fields (OSM has no rating/price):** show gracefully. OSM places render
   as "unrated" / price-unknown; the price and rating filters **do not exclude a
   business merely for lacking that field**.

## Architecture

### Normalized business model

One shape every provider maps into. Provider-specific gaps are explicitly
**nullable** so the UI can distinguish "unknown" from a real value.

```ts
// types/providers.ts
export type ProviderId = 'yelp' | 'osm';

export interface NormalizedBusiness {
  providerId: ProviderId;
  providerBusinessId: string;          // id within that provider
  id: string;                          // stable app id: `${providerId}:${providerBusinessId}`
  name: string;
  coordinates: { latitude: number; longitude: number };
  address?: string;
  categoryAliases: string[];           // CANONICAL aliases (see Category normalization)
  rating: number | null;               // null when the provider doesn't supply it (OSM)
  reviewCount: number | null;
  priceLevel: 1 | 2 | 3 | 4 | null;    // null when unknown (OSM)
  hours: OpeningHours | null;          // structured; null when unknown
  isOpenNow: boolean | null;           // null when unknowable from the source
  phone?: string;
  imageUrl?: string;
  raw?: unknown;                       // original payload, dev/debug only
}

export interface OpeningHours {
  // Minimal, provider-agnostic. Enough to answer "open now" and render a summary.
  // Yelp maps from its hours[].open[]; OSM parses opening_hours=*.
  raw?: string;                        // e.g. OSM opening_hours string
  periods?: Array<{ day: number; start: string; end: string }>;
}
```

Notes:
- `id` is namespaced by provider so results from different sources never collide,
  and so `state.blocked` / favorites keep working across providers (they store `id`).
- The existing `BusinessProps` type stays the app-facing shape the UI already
  consumes; adapters produce `NormalizedBusiness` and a single mapper converts to
  `BusinessProps`. (If `BusinessProps` already matches closely, `NormalizedBusiness`
  can BE the app type; the implementation plan decides whether to unify or bridge —
  the spec's requirement is only that `categoryAliases`, nullable `rating`, and
  nullable `priceLevel` reach the UI intact.)

### Provider interface

```ts
// providers/types.ts
export interface RestaurantProvider {
  id: ProviderId;
  /** Cache policy for results from this provider. */
  cachePolicy: 'cacheable' | 'no-store';
  search(params: {
    term: string;
    coordinates: { latitude: number; longitude: number };
    radiusMeters: number;
    signal?: AbortSignal;
  }): Promise<NormalizedBusiness[]>;
}
```

`cachePolicy` is forward-looking: `yelp` and `osm` are `'cacheable'`. When a future
Google adapter is added it declares `'no-store'`, and the cache layer skips storing
its results — encoding the ToS constraint in one place instead of scattering it.

### Provider registry + fallback

```ts
// providers/index.ts
// Ordered by priority. First is primary; the rest are fallbacks in order.
export const PROVIDER_ORDER: ProviderId[] = ['yelp', 'osm'];

export async function searchRestaurants(params): Promise<{
  results: NormalizedBusiness[];
  usedProvider: ProviderId | null;
  errors: Partial<Record<ProviderId, string>>;
}> {
  // Fallback-only: try providers in order; return the first that yields a
  // non-empty result. Record errors per provider for debugging/telemetry.
  // If a provider throws, log and continue to the next.
  // If all return empty, return { results: [], usedProvider: <last tried>, errors }.
}
```

Fallback triggers: the primary **throws** (network/HTTP/parse error) OR returns an
**empty array**. On either, try the next provider in `PROVIDER_ORDER`. Stop at the
first non-empty result. This is deterministic and adds no dedupe complexity.

### Category normalization (keeps Dealbreakers provider-agnostic)

Filtering (including Dealbreakers) runs on `categoryAliases`. Every provider maps
its native categories into **one canonical alias space**. Because
`constants/foodCategories.ts` (`COMMON_CUISINES`, `FOOD_CATEGORIES`) and the
existing filters already use Yelp-style aliases, **canonical = the current Yelp
alias space** (YAGNI; can be abstracted to a neutral space later).

- **Yelp adapter:** already uses these aliases — passthrough.
- **OSM adapter:** carries a small `cuisine=* → canonical alias` map. OSM
  `cuisine` values are semicolon-delimited (e.g. `italian;pizza`) and use their own
  vocabulary; the map normalizes the common ones (e.g. `indian → indpak`,
  `sushi → sushi`, `pizza → pizza`, `burger → burgers`, `mexican → mexican`,
  `chinese → chinese`, `thai → thai`, `seafood → seafood`, `vegan → vegan`). Unknown
  cuisine values pass through as-is (lowercased) so they still display, they just
  won't match a curated dealbreaker chip. The map lives next to `COMMON_CUISINES`
  so the two stay aligned.

This is the load-bearing tie to the shipped Dealbreakers feature: the reducer's
`computeVisibleResults` and the "Never show me" chips keep working unchanged,
whatever source produced the business.

### Caching

Rouxlette already caches search results in AsyncStorage keyed by location+term.
Extend the cache key to include `usedProvider`, and **only store results when the
producing provider's `cachePolicy === 'cacheable'`**. Yelp and OSM are both
cacheable, so behavior is unchanged today; the gate exists so a future `no-store`
provider can't be cached by accident.

## OpenStreetMap (`osm`) adapter specifics

- **Endpoint:** Overpass API. Query `node/way/relation["amenity"="restaurant"]`
  within `(around:<radiusMeters>,<lat>,<lon>)`, requesting tags including `name`,
  `cuisine`, `opening_hours`, `addr:*`, `phone`. Term filtering: Overpass has weak
  free-text search, so match `term` against `name`/`cuisine` client-side after the
  spatial query (the spatial query is the cheap part).
- **Geocoding:** reuse the app's already-resolved coordinates. **Do not call
  Nominatim** (1 req/s cap, prohibits systematic use). OSM search is coordinates-in,
  so this is fine.
- **Rate/fair-use:** send a descriptive `User-Agent`/`Referer` identifying the app
  (Overpass requires identification). Keep call volume low (fallback-only already
  does this). Pick a public Overpass endpoint; make it configurable so it can be
  swapped or self-hosted later.
- **Field mapping:** `name`→name; lat/lon→coordinates; `cuisine`→`categoryAliases`
  (via the map above); `opening_hours`→`hours.raw` + parsed `isOpenNow` (parse the
  common subset; when unparseable, `hours.raw` set and `isOpenNow: null`);
  `rating: null`, `reviewCount: null`, `priceLevel: null`; `addr:*`→address.
- **id:** `osm:<type>/<osmId>` (e.g. `osm:node/123`).

## Yelp (`yelp`) adapter

Wrap the existing `api/yelp.ts` behind `RestaurantProvider`. It already returns
categories/rating/price/hours; the adapter maps its response to
`NormalizedBusiness` (aliases passthrough, `priceLevel` from `$`-string length,
`isOpenNow` from `hours[].is_open_now` when present). `cachePolicy: 'cacheable'`.
No behavior change to Yelp calls themselves.

## Integration points

- **`hooks/useResults.ts`** calls `searchRestaurants(...)` from the registry instead
  of Yelp directly, then maps `NormalizedBusiness[]` to the app's `BusinessProps[]`
  for dispatch. Caching logic moves behind the `cachePolicy` gate.
- **Reducer / Dealbreakers / filters:** unchanged — they consume normalized
  businesses and `categoryAliases`.
- **UI graceful degradation (decision #4):**
  - Rating component renders a neutral "unrated" state when `rating === null`
    (not 0 stars, which would read as "bad").
  - Price display shows nothing / "price unknown" when `priceLevel === null`.
  - **Price and rating filters treat `null` as "not excluded"** — a business is
    dropped by a price/rating filter only when it *has* a value that fails the
    filter, never for lacking the field. (This is a small, explicit change to
    `utils/filterBusinesses.ts`.)
- **Provider attribution:** when OSM results are shown, display the required
  "© OpenStreetMap contributors" attribution (ODbL). A small footer/label on the
  results list satisfies this. Yelp attribution rules already apply to Yelp results.

## Data flow

1. Search input → `useResults` → `searchRestaurants({term, coords, radius})`.
2. Registry tries `yelp`; on throw or empty, tries `osm`.
3. First non-empty provider's `NormalizedBusiness[]` returns (with `usedProvider`).
4. `useResults` maps to `BusinessProps[]`, dispatches `setResults` (reducer applies
   Dealbreakers/filters/blocked as today).
5. Results cached iff `cachePolicy === 'cacheable'`, key includes `usedProvider`.

## Error handling

- A provider that throws is logged (`logSafe`) with `{ providerId, message }`,
  recorded in the returned `errors` map, and does not abort the search — the next
  provider is tried.
- If **all** providers fail or return empty, the registry returns an empty result
  set; the existing empty-state UI handles it (including the Dealbreakers
  "all avoided" state shipped earlier).
- Aborts (`AbortSignal`) propagate to the active provider call.

## Testing

- **Registry (fallback logic):** Yelp non-empty → returns Yelp, OSM never called;
  Yelp throws → OSM tried; Yelp empty → OSM tried; both empty → empty result +
  errors recorded; abort propagates.
- **OSM adapter:** Overpass response fixture → correct `NormalizedBusiness` mapping
  (name/coords/address/phone), `cuisine` → canonical aliases via the map (incl. a
  multi-value `a;b` case and an unknown value passthrough), `opening_hours` → `hours`
  + `isOpenNow` for a parseable case and `null` for an unparseable one, and
  `rating/reviewCount/priceLevel` all `null`. `cachePolicy === 'cacheable'`.
- **Yelp adapter:** existing Yelp response fixture → `NormalizedBusiness` mapping,
  `priceLevel` from `$` length, aliases passthrough, `isOpenNow` mapping.
- **Cache gate:** `no-store` provider results are not persisted; `cacheable` are.
- **Filter degradation:** a business with `priceLevel: null` / `rating: null` is
  NOT excluded by an active price/rating filter; one with a failing value IS.
- **Category tie-in:** an OSM business whose cuisine maps to a dealbreakered alias
  is excluded by `computeVisibleResults` exactly like a Yelp one (integration-level
  assertion that normalization feeds the existing filter).

## Out of scope (explicit, documented as future)

- **Hybrid static base** — ingesting Foursquare OS Places / Overture as a cacheable
  category/location index with live calls only for dynamic fields. This is the
  cheapest-at-scale path; deferred until real limits are felt.
- **Premium detail providers** — Google Places (New) and Foursquare Premium
  adapters, including Google's no-caching ToS handling (the `cachePolicy: 'no-store'`
  hook already anticipates it).
- **Cross-provider dedupe/merge** — this cut is fallback-only; merging both sources
  by name+geo is a later enhancement.
- **Per-tap details fetch** — fetching dynamic fields lazily when a user opens a
  result (the cost-minimizing pattern for paid providers).
- **Neutral canonical taxonomy** — abstracting the canonical alias space away from
  Yelp's vocabulary; only worth it once a non-Yelp primary exists.

## Open questions / to verify before/along implementation

- **Yelp current free-tier limits** (2025 tightening) — confirm what the project's
  key actually allows, since it affects how hard OSM fallback gets exercised.
- **Overpass endpoint choice** — pick a public instance and confirm its fair-use
  posture; make it configurable for later self-hosting.
- **`BusinessProps` vs `NormalizedBusiness`** — the implementation plan decides
  whether to unify the types or bridge with a mapper; spec only requires the three
  fields (aliases, nullable rating, nullable price) survive to the UI.
