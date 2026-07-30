# Dealbreakers — emphasizing the "I don't want" filtering

**Date:** 2026-07-30
**Status:** Design approved, pending spec review

## Goal

Make Rouxlette's differentiator — respecting what you *don't* want — a first-class,
visible feature. The wheel/results already exclude blocked places and (per-search)
excluded categories; this adds a **persistent "Dealbreakers" list** of cuisines you
never want, lets you **tweak it per-search**, and **shows it working** via an
"Avoiding …" bar.

Scoped to **API-matchable dimensions** (cuisine/category + specific-business block) so
it stays portable across restaurant providers (Yelp today, others later).

## User-facing behavior

- In the **Filters sheet**, a **"Never show me"** section lets the user toggle cuisines
  they never want (curated common-cuisines chips). These are **persistent** — saved and
  applied to every search and spin until changed. Toggling applies immediately (it's a
  standing preference, not gated on "Apply Filters").
- The existing per-search **cuisine chips** stay above it for this-search include/exclude
  tweaks (unchanged 3-state behavior).
- An **"Avoiding: …" bar** appears on Home (near the wheel) and in the Search results
  header when there is anything to avoid, e.g. `Avoiding: Fast Food, Sushi · 3 blocked`.
  Tapping it opens the Filters sheet. Only rendered when non-empty.
- The wheel never lands on, and the results never show, anything matching the effective
  exclusions.

## Combination & override rule ("baseline + tweak")

Effective excluded cuisines for a search =

```
(dealbreakerCategoryIds ∪ filters.excludedCategoryIds) − filters.categoryIds
```

- **Dealbreakers** are the standing NO (baseline).
- A per-search **exclude** adds to it.
- A per-search **include** (`filters.categoryIds`, the whitelist chip) **overrides** a
  dealbreaker for that search only — "actually, sushi tonight."
- **Blocked places** (`state.blocked`, ID match) are always excluded, independent of
  categories.

## Data model

`context/state.ts` — `AppState`:
- Add `dealbreakerCategoryIds: string[]` (canonical cuisine aliases). Default `[]` in
  `initialAppState`.
- Unchanged: `filters.excludedCategoryIds`, `filters.categoryIds`, `blocked`.

`context/actions.ts` + `context/reducer.ts`:
- `ToggleDealbreaker` — payload `{ alias: string }`; adds/removes the alias in
  `dealbreakerCategoryIds`, then recomputes `results`.
- `HydrateDealbreakers` — payload `{ aliases: string[] }`; sets the list (from storage),
  then recomputes `results`.
- Creators `toggleDealbreaker(alias)`, `hydrateDealbreakers(aliases)`.

## Filtering (single source of truth)

Extend the reducer helper added in #61:

```
computeVisibleResults(rawResults, filters, blocked, dealbreakers)
  → applyFilters(rawResults, { ...filters, excludedCategoryIds: effectiveExcluded })
        .filter(b => !blockedIds.has(b.id))

effectiveExcluded =
  [...new Set([...dealbreakers, ...filters.excludedCategoryIds])]
    .filter(alias => !filters.categoryIds.includes(alias))
```

`applyFilters` (utils/filterBusinesses) is unchanged — it already drops businesses whose
`categories[].alias` intersects `excludedCategoryIds`; we just feed it the merged set.

Update every call site of `computeVisibleResults` to pass `state.dealbreakerCategoryIds`:
`SetResults`, `SetFilters`, `ResetFilters`, `ToggleCategoryFilter`, `AddBlocked`,
`RemoveBlocked`, `HydrateBlocked`, and the new `ToggleDealbreaker`/`HydrateDealbreakers`.

Because filtering stays in `computeVisibleResults`, both the Search results list and
`state.results` (which the Home wheel spins over) honor dealbreakers automatically — no
change to `useResults` or the Yelp request. This keeps it **provider-agnostic**: the
exclusion reads only `business.categories[].alias`, no Yelp-specific field.

## Persistence

New `hooks/useDealbreakers.ts`, mirroring `hooks/useBlocked.ts`:
- Storage key `'dealbreakers'`; hydrate once on mount → `dispatch(hydrateDealbreakers(...))`;
  persist `state.dealbreakerCategoryIds` on change (debounced/change-detected like blocked).
- Called from the same screens that already mount `useBlocked` (Home, Search) so it
  hydrates regardless of entry route.

## UI

### Curated cuisine list
- Add `COMMON_CUISINES: { alias: string; label: string }[]` to `constants/foodCategories`
  — a fixed, predictable set (e.g. Fast Food, Sushi,
  Buffet, Pizza, Mexican, Chinese, Indian, Thai, Vegan, Steakhouse, …). Fixed list, not
  derived from current results, since dealbreakers are a standing preference.

### FiltersSheet — "Never show me" section
- New section below the existing cuisine section: title "Never show me" + subtitle
  "Always hidden from results".
- Render `COMMON_CUISINES` as toggle chips; a chip is active when its alias is in
  `state.dealbreakerCategoryIds`. Active styling uses the 🚫/error-tinted treatment,
  distinct from the include chips.
- Tapping a chip dispatches `toggleDealbreaker(alias)` **immediately** (persistent), not
  through the sheet's local "Apply" flow. A one-line hint clarifies it's always-on.

### AvoidingBar component
- `components/AvoidingBar.tsx` — a compact row summarizing what's being excluded:
  dealbreaker labels + per-search exclude labels + `· N blocked`. Tapping opens the
  Filters sheet (via the existing `setShowFilter(true)`).
- Rendered on Home (near the wheel) and in the Search results header. On Search it
  **replaces** the existing "N blocked hidden" summary (#61) — the blocked count folds
  into this bar. Only shown when non-empty.
- Label lookup: alias → display name via `COMMON_CUISINES` / existing category labels.

## Edge cases

- **Everything excluded:** if dealbreakers/excludes remove all matches, reuse the existing
  "all blocked / no matches" empty states; extend copy to mention dealbreakers where
  relevant.
- **Dealbreaker + per-search include of the same cuisine:** shown this search (override
  rule), dealbreaker preserved for next time.
- **Spin safety:** the Home wheel picks from `state.results` (already dealbreaker/blocked
  filtered), so it can never land on an excluded cuisine.
- **Hydration race:** dealbreakers may hydrate after results are set; `HydrateDealbreakers`
  recomputes `results` (same pattern as `HydrateBlocked` in #61).
- **Blocked vs dealbreaker counts** in the Avoiding bar are distinct (places vs cuisines).

## Testing

- **reducer:** dealbreaker excludes a matching business from `results` but keeps
  `rawResults`; per-search *include* of a dealbreaker cuisine overrides it (shown);
  union with blocked; `HydrateDealbreakers` re-filters results set before hydration.
- **persistence:** `useDealbreakers` hydrates from and persists to storage.
- **FiltersSheet:** toggling a "Never show me" chip dispatches `toggleDealbreaker` and
  reflects active state from `dealbreakerCategoryIds`.
- **AvoidingBar:** renders the correct summary (cuisines + blocked count); hidden when
  nothing to avoid; tap opens filters.

## Out of scope (explicit)

- The full **multi-provider adapter layer** (normalizing non-Yelp providers into a shared
  category taxonomy). This design only ensures the exclusion logic doesn't couple to Yelp;
  building the abstraction is a separate future effort.
- **Non-category exclusions** (ingredient/dietary-level, e.g. "no cilantro") — not
  reliably API-matchable.
- **Provider query-side exclusion** — we filter client-side, which is portable.
