# Dealbreakers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent "Dealbreakers" (never-want cuisines) with per-search override, filtered in the reducer, and an "Avoiding …" bar that showcases it on Home and Search.

**Architecture:** Exclusion stays a single-source-of-truth in the reducer's `computeVisibleResults`, which merges `dealbreakerCategoryIds ∪ filters.excludedCategoryIds`, subtracts per-search includes (`filters.categoryIds`), then removes blocked places. A persisted `useDealbreakers` hook (mirroring `useBlocked`) hydrates/saves the list. UI: a "Never show me" section in the Filters sheet (applies immediately) + an `AvoidingBar` component. Client-side only — no Yelp query change — so it reads only `business.categories[].alias` and stays provider-portable.

**Tech Stack:** React Native + Expo, React Context + `useReducer`, AsyncStorage via `usePersistentStorage`, jest-expo + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-07-30-dealbreakers-exclusion-design.md`

**Conventions:** Package manager is **yarn**. Run tests with `yarn jest <path>`. Every task ends by running the full suite (`yarn jest`) and `npx tsc --noEmit` (baseline is 159 errors — do not increase it). Commit at the end of each task.

## File structure

- `context/state.ts` — add `dealbreakerCategoryIds: string[]` to `AppState` + `initialAppState`.
- `context/actions.ts` — `ToggleDealbreaker`, `HydrateDealbreakers` action types + union.
- `context/reducer.ts` — extend `computeVisibleResults`; new cases + creators; update call sites.
- `constants/foodCategories.ts` — `COMMON_CUISINES` curated list.
- `hooks/useDealbreakers.ts` — new persistence hook (mirror `hooks/useBlocked.ts`).
- `components/AvoidingBar.tsx` — new presentational component.
- `components/filter/FiltersSheet.tsx` — "Never show me" section.
- `screens/HomeScreen.tsx`, `screens/SearchScreen.tsx` — mount `useDealbreakers`, render `AvoidingBar`.
- Tests alongside: `__tests__/context/reducer.test.ts`, `__tests__/hooks/useDealbreakers.test.tsx`, `components/__tests__/AvoidingBar.test.tsx`, `components/filter/__tests__/FiltersSheet.test.tsx`, screen tests.

---

### Task 1: State + reducer — dealbreaker exclusion with per-search override

**Files:**
- Modify: `context/state.ts` (AppState + initialAppState)
- Modify: `context/actions.ts` (action types + union)
- Modify: `context/reducer.ts` (`computeVisibleResults`, cases, creators, call sites)
- Test: `__tests__/context/reducer.test.ts`

- [ ] **Step 1: Add state field**

In `context/state.ts`, add to the `AppState` interface (near `blocked`):
```ts
	dealbreakerCategoryIds: string[]; // persistent "never want" cuisine aliases (#dealbreakers)
```
And to `initialAppState`:
```ts
	dealbreakerCategoryIds: [],
```

- [ ] **Step 2: Add action types**

In `context/actions.ts`, add to the `ActionType` enum (after `ToggleCategoryFilter`):
```ts
	ToggleDealbreaker,
	HydrateDealbreakers,
```
Add interfaces (near `ToggleCategoryFilter`):
```ts
export interface ToggleDealbreaker {
	type: ActionType.ToggleDealbreaker;
	payload: { alias: string };
}

export interface HydrateDealbreakers {
	type: ActionType.HydrateDealbreakers;
	payload: { aliases: string[] };
}
```
Add both to the `AppActions` union (append):
```ts
 | ToggleDealbreaker | HydrateDealbreakers;
```

- [ ] **Step 3: Write the failing reducer tests**

In `__tests__/context/reducer.test.ts`, import the new creators (extend the existing import line):
```ts
import { appReducer, setResults, setFilters, addBlocked, toggleDealbreaker, hydrateDealbreakers } from '../../context/reducer';
```
Add this describe block:
```ts
describe('dealbreakers exclusion (#dealbreakers)', () => {
  const biz = (id: string, cats: string[] = []) =>
    ({ id, name: id, distance: 100, rating: 4, categories: cats.map(a => ({ alias: a, title: a })) } as any);
  const [pizza, sushi, tacos] = [biz('a', ['pizza']), biz('b', ['sushi']), biz('c', ['tacos'])];

  it('excludes dealbreaker cuisines from results but keeps rawResults', () => {
    const seeded = { ...initialAppState, dealbreakerCategoryIds: ['sushi'] };
    const next = appReducer(seeded, setResults([pizza, sushi, tacos]));
    expect(next.results.map((r: any) => r.id)).toEqual(['a', 'c']);
    expect(next.rawResults.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('lets a per-search include override a dealbreaker for that search', () => {
    const seeded = {
      ...initialAppState,
      dealbreakerCategoryIds: ['sushi'],
      filters: { ...initialAppState.filters, categoryIds: ['sushi'] },
    };
    const next = appReducer(seeded, setResults([pizza, sushi, tacos]));
    // categoryIds is a whitelist too, so only sushi passes — and it is NOT excluded.
    expect(next.results.map((r: any) => r.id)).toEqual(['b']);
  });

  it('ToggleDealbreaker adds then removes and re-filters live', () => {
    const withResults = appReducer(initialAppState, setResults([pizza, sushi, tacos]));
    expect(withResults.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
    const added = appReducer(withResults, toggleDealbreaker('sushi'));
    expect(added.dealbreakerCategoryIds).toEqual(['sushi']);
    expect(added.results.map((r: any) => r.id)).toEqual(['a', 'c']);
    const removed = appReducer(added, toggleDealbreaker('sushi'));
    expect(removed.dealbreakerCategoryIds).toEqual([]);
    expect(removed.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('HydrateDealbreakers re-filters results set before hydration', () => {
    const withResults = appReducer(initialAppState, setResults([pizza, sushi, tacos]));
    const next = appReducer(withResults, hydrateDealbreakers(['pizza']));
    expect(next.results.map((r: any) => r.id)).toEqual(['b', 'c']);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `yarn jest __tests__/context/reducer.test.ts -t "dealbreakers exclusion"`
Expected: FAIL — `toggleDealbreaker`/`hydrateDealbreakers` are not exported and results aren't filtered.

- [ ] **Step 5: Extend `computeVisibleResults` and add reducer cases + creators**

In `context/reducer.ts`, replace the `computeVisibleResults` helper with:
```ts
function computeVisibleResults(
	rawResults: BusinessProps[],
	filters: Filters,
	blocked: FavoriteItem[],
	dealbreakers: string[],
): BusinessProps[] {
	const blockedIds = new Set(blocked.map(b => b.id));
	// Dealbreakers + per-search excludes, minus anything explicitly included this
	// search (per-search include overrides the standing NO).
	const effectiveExcluded = [...new Set([...dealbreakers, ...filters.excludedCategoryIds])]
		.filter(alias => !filters.categoryIds.includes(alias));
	const effectiveFilters = { ...filters, excludedCategoryIds: effectiveExcluded };
	return applyFilters(rawResults, effectiveFilters).filter(b => !blockedIds.has(b.id));
}
```
Update **every** `computeVisibleResults(...)` call to pass `state.dealbreakerCategoryIds` as the 4th arg. The call sites are: `SetResults`, `SetFilters`, `ResetFilters`, `ToggleCategoryFilter`, `AddBlocked` (pass `newBlocked`), `RemoveBlocked` (pass `newBlocked`), `HydrateBlocked` (pass `action.payload.blocked`). Example for `SetResults`:
```ts
			results: computeVisibleResults(rawResults, state.filters, state.blocked, state.dealbreakerCategoryIds),
```
Add the new cases (after the `HydrateBlocked` case):
```ts
		case ActionType.ToggleDealbreaker: {
			const { alias } = action.payload;
			const newDealbreakers = state.dealbreakerCategoryIds.includes(alias)
				? state.dealbreakerCategoryIds.filter(a => a !== alias)
				: [...state.dealbreakerCategoryIds, alias];
			return {
				...state,
				dealbreakerCategoryIds: newDealbreakers,
				results: computeVisibleResults(state.rawResults, state.filters, state.blocked, newDealbreakers),
			};
		}
		case ActionType.HydrateDealbreakers:
			return {
				...state,
				dealbreakerCategoryIds: action.payload.aliases,
				results: computeVisibleResults(state.rawResults, state.filters, state.blocked, action.payload.aliases),
			};
```
Add the imports to the `from "./actions"` list: `ToggleDealbreaker`, `HydrateDealbreakers`. Add creators (near `setResults`):
```ts
export const toggleDealbreaker = (alias: string): ToggleDealbreaker => ({
	type: ActionType.ToggleDealbreaker,
	payload: { alias },
});

export const hydrateDealbreakers = (aliases: string[]): HydrateDealbreakers => ({
	type: ActionType.HydrateDealbreakers,
	payload: { aliases },
});
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn jest __tests__/context/reducer.test.ts`
Expected: PASS (the new block + all existing reducer tests).

- [ ] **Step 7: Full suite + typecheck**

Run: `yarn jest` (expect all green) and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect ≤ 159).

- [ ] **Step 8: Commit**

```bash
git add context/state.ts context/actions.ts context/reducer.ts __tests__/context/reducer.test.ts
git commit -m "feat(dealbreakers): persistent cuisine exclusion in the reducer with per-search override"
```

---

### Task 2: `COMMON_CUISINES` curated list

**Files:**
- Modify: `constants/foodCategories.ts`
- Test: `__tests__/constants/commonCuisines.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/constants/commonCuisines.test.ts`:
```ts
import { COMMON_CUISINES } from '../../constants/foodCategories';

describe('COMMON_CUISINES', () => {
  it('is a non-empty list of {alias,label} with unique aliases', () => {
    expect(COMMON_CUISINES.length).toBeGreaterThan(5);
    for (const c of COMMON_CUISINES) {
      expect(typeof c.alias).toBe('string');
      expect(typeof c.label).toBe('string');
    }
    const aliases = COMMON_CUISINES.map(c => c.alias);
    expect(new Set(aliases).size).toBe(aliases.length);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest __tests__/constants/commonCuisines.test.ts`
Expected: FAIL — `COMMON_CUISINES` not exported.

- [ ] **Step 3: Add the constant**

Append to `constants/foodCategories.ts`:
```ts
// Curated common cuisines offered as "Dealbreaker" chips. Aliases are Yelp
// category aliases (the de-facto taxonomy); a future provider adapter maps its
// categories into this same alias space. (#dealbreakers)
export const COMMON_CUISINES: { alias: string; label: string }[] = [
	{ alias: 'hotdogs', label: 'Fast Food' },
	{ alias: 'sushi', label: 'Sushi' },
	{ alias: 'buffets', label: 'Buffet' },
	{ alias: 'pizza', label: 'Pizza' },
	{ alias: 'mexican', label: 'Mexican' },
	{ alias: 'chinese', label: 'Chinese' },
	{ alias: 'indpak', label: 'Indian' },
	{ alias: 'thai', label: 'Thai' },
	{ alias: 'italian', label: 'Italian' },
	{ alias: 'burgers', label: 'Burgers' },
	{ alias: 'seafood', label: 'Seafood' },
	{ alias: 'vegan', label: 'Vegan' },
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn jest __tests__/constants/commonCuisines.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add constants/foodCategories.ts __tests__/constants/commonCuisines.test.ts
git commit -m "feat(dealbreakers): add COMMON_CUISINES curated list"
```

---

### Task 3: `useDealbreakers` persistence hook

**Files:**
- Create: `hooks/useDealbreakers.ts`
- Test: `__tests__/hooks/useDealbreakers.test.tsx`

Read `hooks/useBlocked.ts` first and mirror its structure (module-level hydration guard, `usePersistentStorage`, hydrate-once effect, persist-on-change effect). The hook stores a `string[]` under key `'dealbreakers'` and dispatches `hydrateDealbreakers`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/hooks/useDealbreakers.test.tsx`:
```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { RootContext } from '../../context/RootContext';
import { initialAppState } from '../../context/state';
import { hydrateDealbreakers } from '../../context/reducer';
import { useDealbreakers } from '../../hooks/useDealbreakers';

const mockStorage = {
  getItem: jest.fn(async () => ['sushi']),
  setItem: jest.fn(async () => {}),
  getAllItems: jest.fn(() => []),
};
jest.mock('../../hooks/usePersistentStorage', () => ({
  __esModule: true,
  default: jest.fn(() => mockStorage),
}));

function Harness() {
  useDealbreakers();
  return null;
}

describe('useDealbreakers', () => {
  beforeEach(() => { jest.clearAllMocks(); mockStorage.getItem.mockResolvedValue(['sushi']); });

  it('hydrates the persisted dealbreakers on mount', async () => {
    const dispatch = jest.fn();
    render(
      <RootContext.Provider value={{ state: { ...initialAppState }, dispatch }}>
        <Harness />
      </RootContext.Provider>
    );
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith(hydrateDealbreakers(['sushi'])));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest __tests__/hooks/useDealbreakers.test.tsx`
Expected: FAIL — `useDealbreakers` does not exist.

- [ ] **Step 3: Implement the hook**

Create `hooks/useDealbreakers.ts` (mirroring `useBlocked`; adjust names/key):
```ts
import { useContext, useEffect, useRef } from 'react';
import usePersistentStorage from './usePersistentStorage';
import { RootContext } from '../context/RootContext';
import { hydrateDealbreakers } from '../context/reducer';
import { logSafe } from '../utils/log';

const STORAGE_KEY_DEALBREAKERS = 'dealbreakers';
let dealbreakersHydrated = false;

export function useDealbreakers() {
	const { state, dispatch } = useContext(RootContext);
	const storage = usePersistentStorage();
	const hasHydratedRef = useRef(false);
	const lastPersistedRef = useRef<string | null>(null);

	// Hydrate once (module-level guard, like useBlocked).
	useEffect(() => {
		if (dealbreakersHydrated || hasHydratedRef.current) return;
		hasHydratedRef.current = true;
		dealbreakersHydrated = true;
		(async () => {
			try {
				const stored = await storage.getItem<string[]>(STORAGE_KEY_DEALBREAKERS);
				if (Array.isArray(stored)) {
					dispatch(hydrateDealbreakers(stored));
				}
			} catch (error: any) {
				logSafe('[useDealbreakers] Error loading dealbreakers', { message: error?.message });
			}
		})();
	}, [storage, dispatch]);

	// Persist on change.
	useEffect(() => {
		if (!dealbreakersHydrated) return;
		const currentJson = JSON.stringify(state.dealbreakerCategoryIds);
		if (currentJson === lastPersistedRef.current) return;
		lastPersistedRef.current = currentJson;
		(async () => {
			try {
				await storage.setItem(STORAGE_KEY_DEALBREAKERS, state.dealbreakerCategoryIds);
			} catch (error: any) {
				logSafe('[useDealbreakers] Error persisting dealbreakers', { message: error?.message });
			}
		})();
	}, [state.dealbreakerCategoryIds, storage]);

	return { dealbreakers: state.dealbreakerCategoryIds };
}
```
Note: if `useBlocked` uses a different `usePersistentStorage` import style or method names (`getItem<T>`), match it exactly — read that file and align.

- [ ] **Step 4: Run to verify it passes**

Run: `yarn jest __tests__/hooks/useDealbreakers.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full suite + typecheck, then commit**

Run: `yarn jest` and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (≤159).
```bash
git add hooks/useDealbreakers.ts __tests__/hooks/useDealbreakers.test.tsx
git commit -m "feat(dealbreakers): persist/hydrate dealbreakers via useDealbreakers"
```

---

### Task 4: `AvoidingBar` component

**Files:**
- Create: `components/AvoidingBar.tsx`
- Test: `components/__tests__/AvoidingBar.test.tsx`

Presentational + dumb: takes alias lists + blocked count + `onPress`, maps aliases → labels via `COMMON_CUISINES` (falling back to the alias), renders `Avoiding: A, B · N blocked`, returns `null` when there is nothing to avoid.

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/AvoidingBar.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AvoidingBar } from '../AvoidingBar';

describe('AvoidingBar', () => {
  it('renders nothing when there is nothing to avoid', () => {
    const { queryByTestId } = render(
      <AvoidingBar dealbreakers={[]} perSearchExcludes={[]} blockedCount={0} onPress={jest.fn()} />
    );
    expect(queryByTestId('avoiding-bar')).toBeNull();
  });

  it('summarizes cuisines and blocked count, and fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <AvoidingBar dealbreakers={['sushi']} perSearchExcludes={['pizza']} blockedCount={3} onPress={onPress} />
    );
    expect(getByText(/Sushi/)).toBeTruthy();
    expect(getByText(/Pizza/)).toBeTruthy();
    expect(getByText(/3 blocked/)).toBeTruthy();
    fireEvent.press(getByTestId('avoiding-bar'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest components/__tests__/AvoidingBar.test.tsx`
Expected: FAIL — `AvoidingBar` not found.

- [ ] **Step 3: Implement the component**

Create `components/AvoidingBar.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supperClub } from '../theme/supperClub';
import { COMMON_CUISINES } from '../constants/foodCategories';

interface AvoidingBarProps {
  dealbreakers: string[];
  perSearchExcludes: string[];
  blockedCount: number;
  onPress: () => void;
}

const labelFor = (alias: string) =>
  COMMON_CUISINES.find(c => c.alias === alias)?.label ?? alias;

export const AvoidingBar: React.FC<AvoidingBarProps> = ({ dealbreakers, perSearchExcludes, blockedCount, onPress }) => {
  const cuisineAliases = [...new Set([...dealbreakers, ...perSearchExcludes])];
  if (cuisineAliases.length === 0 && blockedCount === 0) return null;

  const cuisineLabels = cuisineAliases.map(labelFor).join(', ');
  const parts = [
    cuisineLabels ? `Avoiding: ${cuisineLabels}` : 'Avoiding',
    blockedCount > 0 ? `${blockedCount} blocked` : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      onPress={onPress}
      testID="avoiding-bar"
      accessibilityRole="button"
      accessibilityLabel={`Avoiding filters. ${parts.join('. ')}. Tap to edit.`}
    >
      <Ionicons name="eye-off-outline" size={14} color={supperClub.textMuted} />
      <Text style={styles.text} numberOfLines={1}>{parts.join('  ·  ')}</Text>
      <Ionicons name="chevron-forward" size={14} color={supperClub.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: supperClub.surface,
    borderWidth: 1,
    borderColor: supperClub.borderSoft,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, fontSize: 12, color: supperClub.textMuted },
});

export default AvoidingBar;
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn jest components/__tests__/AvoidingBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/AvoidingBar.tsx components/__tests__/AvoidingBar.test.tsx
git commit -m "feat(dealbreakers): AvoidingBar summary component"
```

---

### Task 5: FiltersSheet "Never show me" section

**Files:**
- Modify: `components/filter/FiltersSheet.tsx`
- Test: `components/filter/__tests__/FiltersSheet.test.tsx`

The section renders `COMMON_CUISINES` as toggle chips reflecting `state.dealbreakerCategoryIds`; tapping a chip dispatches `toggleDealbreaker(alias)` **immediately** (not through the local Apply flow).

- [ ] **Step 1: Write the failing test**

In `components/filter/__tests__/FiltersSheet.test.tsx`, add (the file already has a `renderFiltersSheet` helper returning `{ mockDispatch }` and imports from `../../../context/reducer`):
```tsx
import { toggleDealbreaker } from '../../../context/reducer';

// ...inside describe('FiltersSheet', ...):
it('shows the "Never show me" section and toggles a dealbreaker immediately', () => {
  const { getByText, getByTestId, mockDispatch } = renderFiltersSheet();
  expect(getByText('Never show me')).toBeTruthy();
  fireEvent.press(getByTestId('dealbreaker-sushi'));
  expect(mockDispatch).toHaveBeenCalledWith(toggleDealbreaker('sushi'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest components/filter/__tests__/FiltersSheet.test.tsx -t "Never show me"`
Expected: FAIL — no such text/testID.

- [ ] **Step 3: Implement the section**

In `components/filter/FiltersSheet.tsx`:
1. Add imports:
```tsx
import { COMMON_CUISINES } from '../../constants/foodCategories';
import { toggleDealbreaker } from '../../context/reducer';
```
2. In the component body, read the current dealbreakers from context (the component already has `state`/`dispatch` via `useContext(RootContext)`):
```tsx
const dealbreakers = state.dealbreakerCategoryIds;
```
3. Add the section JSX after the existing cuisine/category section, before the closing of the scroll content:
```tsx
          <Divider />

          {/* Dealbreakers — persistent, applied immediately (#dealbreakers) */}
          <View>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Never show me</Text>
              <Text style={styles.sectionSubtitle}>Always hidden</Text>
            </View>
            <View style={styles.dealbreakerWrap}>
              {COMMON_CUISINES.map(cuisine => {
                const active = dealbreakers.includes(cuisine.alias);
                return (
                  <Pressable
                    key={cuisine.alias}
                    testID={`dealbreaker-${cuisine.alias}`}
                    onPress={() => dispatch(toggleDealbreaker(cuisine.alias))}
                    style={[styles.dealbreakerChip, active && styles.dealbreakerChipActive]}
                  >
                    <MaterialIcons
                      name="block"
                      size={14}
                      color={active ? '#FFFFFF' : supperClub.textMuted}
                    />
                    <Text style={[styles.dealbreakerText, active && styles.dealbreakerTextActive]}>
                      {cuisine.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
```
4. Add the styles (in the sheet's `StyleSheet.create`):
```tsx
  dealbreakerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dealbreakerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: supperClub.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dealbreakerChipActive: {
    backgroundColor: supperClub.error,
    borderColor: supperClub.error,
  },
  dealbreakerText: { fontSize: 13, color: supperClub.text },
  dealbreakerTextActive: { color: '#FFFFFF' },
```
Note: `MaterialIcons`, `Pressable`, `Divider`, `View`, `Text`, `supperClub`, and `styles.sectionTitleWrapper/sectionTitle/sectionSubtitle` already exist in this file — reuse them; do not re-import/re-declare.

- [ ] **Step 4: Run to verify it passes**

Run: `yarn jest components/filter/__tests__/FiltersSheet.test.tsx`
Expected: PASS (the new test + all existing FiltersSheet tests).

- [ ] **Step 5: Full suite + typecheck, then commit**

```bash
git add components/filter/FiltersSheet.tsx components/filter/__tests__/FiltersSheet.test.tsx
git commit -m "feat(dealbreakers): 'Never show me' section in the filter sheet"
```

---

### Task 6: Wire hydration + AvoidingBar into Home and Search

**Files:**
- Modify: `screens/HomeScreen.tsx` (mount `useDealbreakers`, render `AvoidingBar` near the wheel)
- Modify: `screens/SearchScreen.tsx` (mount `useDealbreakers`, render `AvoidingBar` in the results header, replacing the "N blocked hidden" summary)
- Test: `__tests__/screens/SearchScreen.test.tsx`

- [ ] **Step 1: Write the failing test (Search)**

In `__tests__/screens/SearchScreen.test.tsx`, mock the new hook near the other hook mocks:
```tsx
jest.mock('../../hooks/useDealbreakers', () => ({ useDealbreakers: () => ({ dealbreakers: [] }) }));
```
Add a test that the AvoidingBar shows when there are dealbreakers/blocked. Reuse the existing configurable `mockBlockedIds` and add a dealbreaker via state:
```tsx
it('shows the Avoiding bar when there are dealbreakers or blocked results', () => {
  const state = {
    ...mockInitialState,
    dealbreakerCategoryIds: ['sushi'],
    results: [{ id: 'a', name: 'Alpha Cafe', categories: [] }] as any,
    rawResults: [{ id: 'a', name: 'Alpha Cafe', categories: [] }] as any,
  };
  const { getByTestId } = render(
    <RootContext.Provider value={{ state, dispatch: mockDispatch }}>
      <SearchScreen />
    </RootContext.Provider>
  );
  expect(getByTestId('avoiding-bar')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn jest __tests__/screens/SearchScreen.test.tsx -t "Avoiding bar"`
Expected: FAIL — no `avoiding-bar` rendered (and possibly a missing-mock error for `useDealbreakers`).

- [ ] **Step 3: Implement in SearchScreen**

In `screens/SearchScreen.tsx`:
1. Imports:
```tsx
import { useDealbreakers } from '../hooks/useDealbreakers';
import { AvoidingBar } from '../components/AvoidingBar';
```
2. In the component body (near the other hooks):
```tsx
useDealbreakers(); // hydrate/persist even when Search is the entry route
```
3. Replace the existing results-meta row (the `favoritesCount`/`blockedHiddenCount` summary added in #61) — keep `favoritesCount` if desired, but render the AvoidingBar for the exclusion summary. In the `ListHeaderComponent`, add below the results count:
```tsx
                                <AvoidingBar
                                    dealbreakers={state.dealbreakerCategoryIds}
                                    perSearchExcludes={state.filters.excludedCategoryIds}
                                    blockedCount={blockedHiddenCount}
                                    onPress={() => dispatch(setShowFilter(true))}
                                />
```
(`blockedHiddenCount` and `favoritesCount` already exist from #61. Leave the favorites chip; remove only the standalone "N blocked hidden" chip so the count isn't shown twice.)

- [ ] **Step 4: Run to verify it passes (Search)**

Run: `yarn jest __tests__/screens/SearchScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implement in HomeScreen**

In `screens/HomeScreen.tsx`:
1. Imports (same two as above).
2. `useDealbreakers();` near the other hooks.
3. Render the bar just above/below the wheel container (inside the main scroll/content), e.g. after `wheelContainer`:
```tsx
        <AvoidingBar
          dealbreakers={state.dealbreakerCategoryIds}
          perSearchExcludes={state.filters.excludedCategoryIds}
          blockedCount={0}
          onPress={() => dispatch(setShowFilter(true))}
        />
```
(Home doesn't compute a blocked-hidden count; `0` is fine — the bar still shows the avoided cuisines. If a count is wanted later, derive it like SearchScreen.)

- [ ] **Step 6: Full suite + typecheck**

Run: `yarn jest` (all green) and `npx tsc --noEmit 2>&1 | grep -c "error TS"` (≤159). If the HomeScreen or SearchScreen test suites mock `@react-navigation` etc., ensure the `useDealbreakers` mock is present in any suite that renders these screens (add `jest.mock('../../hooks/useDealbreakers', () => ({ useDealbreakers: () => ({ dealbreakers: [] }) }))` where needed).

- [ ] **Step 7: Commit**

```bash
git add screens/HomeScreen.tsx screens/SearchScreen.tsx __tests__/screens/SearchScreen.test.tsx
git commit -m "feat(dealbreakers): hydrate + show Avoiding bar on Home and Search"
```

---

## Self-review notes (author checklist — already applied)

- **Spec coverage:** state/persistence (T1, T3), combination + override rule (T1), COMMON_CUISINES (T2), Filters "Never show me" (T5), AvoidingBar showcase (T4, T6), reducer single-source filtering incl. spin (T1 — `state.results` is what the wheel spins), hydration race (T1 HydrateDealbreakers test). Empty-state copy tweak is minor and folded into existing empty states — not a separate task.
- **Placeholders:** none — every code/test step has literal content.
- **Type consistency:** `dealbreakerCategoryIds` (string[]), `toggleDealbreaker(alias)`, `hydrateDealbreakers(aliases)`, `computeVisibleResults(raw, filters, blocked, dealbreakers)` used consistently across tasks.
- **Provider portability:** exclusion reads only `business.categories[].alias`; no Yelp field. Confirmed in T1.

## Post-implementation

- Run the full suite + `tsc`, then ship through the standard branch → PR → codex gate → squash-merge flow (per repo CLAUDE.md). Pure JS — OTA-deliverable.
