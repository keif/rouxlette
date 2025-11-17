import { AppState, Filter, Filters, SpinHistory, initialFilters } from "./state";
import { logSafe } from "../utils/log";
import { deepEqual } from "../utils/deepEqual";
import {
	ActionType,
	AppActions,
	SetCategories,
	SetDetail,
	SetFilter,
	SetFilters,
	ResetFilters,
	HydrateFilters,
	SetLocation,
	SetCoords,
	SetResults,
	SetShowFilter,
	AddFavorite,
	RemoveFavorite,
	HydrateFavorites,
	AddHistory,
	ClearHistory,
	HydrateHistory,
	AddSpinHistory,
	SetSelectedBusiness,
	ShowBusinessModal,
	HideBusinessModal,
} from "./actions";
import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { YelpBusiness } from "../types/yelp";
import { FavoriteItem, HistoryItem, HISTORY_MAX_ITEMS } from "../types/favorites";
import { LocationObjectCoords } from "expo-location";

// Normalize history items with sanitization, stable ordering, and cap
function normalizeHistory(items: HistoryItem[]): HistoryItem[] {
  // Helpers kept local to avoid new imports
  const toTimestamp = (t: any): number => {
    if (typeof t === 'number' && Number.isFinite(t)) return t;
    if (typeof t === 'string') {
      const p = Date.parse(t);
      if (Number.isFinite(p)) return p;
    }
    return Date.now();
  };
  const makeId = () => `hist_${Math.random().toString(36).slice(2, 10)}`;

  // 1) Sanitize each item
  const cleaned = (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((it: any) => ({
      ...it,
      id: typeof it?.id === 'string' && it.id.length > 0 ? it.id : makeId(),
      selectedAt: toTimestamp(it?.selectedAt),
    }));

  // 2) De-dupe by id (fallback to businessId if present)
  const seen = new Set<string>();
  const deduped: HistoryItem[] = [];
  for (const it of cleaned) {
    const key = (it as any).id ?? (it as any).businessId ?? makeId();
    const k = String(key);
    if (!seen.has(k)) {
      seen.add(k);
      deduped.push(it as HistoryItem);
    }
  }

  // 3) Stable sort: newest first by selectedAt, then by id
  deduped.sort((a: any, b: any) => {
    const ta = toTimestamp(a?.selectedAt);
    const tb = toTimestamp(b?.selectedAt);
    if (tb !== ta) return tb - ta;
    const ida = typeof a?.id === 'string' ? a.id : '';
    const idb = typeof b?.id === 'string' ? b.id : '';
    return ida.localeCompare(idb);
  });

  // 4) Cap to max
  return deduped.slice(0, HISTORY_MAX_ITEMS);
}

export function appReducer(state: AppState, action: AppActions): AppState {
	switch (action.type) {
		case ActionType.SetCategories:
			return {
				...state,
				categories: action.payload.categories,
			};
		case ActionType.SetDetail:
			return {
				...state,
				detail: action.payload.detail,
			};
		case ActionType.SetFilter:
			logSafe(`SetFilter`, { actionType: action.type, payloadKeys: Object.keys(action.payload || {}) });
			return {
				...state,
				filter: {
					...state.filter,
					...action.payload.filter
				},
			};
		case ActionType.SetLocation:
			const newLocation = action.payload.location;
			const locationChanged = state.location && state.location !== newLocation;

			// Clear results if location has changed significantly to prevent wrong-city roulette picks
			return {
				...state,
				location: newLocation,
				// Clear results when location changes to prevent stale results from wrong cities
				...(locationChanged && { results: [] })
			};
		case ActionType.SetCoords:
			return {
				...state,
				currentCoords: action.payload.coords,
			};
		case ActionType.SetResults:
			return {
				...state,
				results: action.payload.results,
			};
		case ActionType.SetShowFilter:
			return {
				...state,
				showFilter: action.payload.showFilter,
			};
		case ActionType.AddFavorite:
			// De-dupe by businessId, upsert and refresh addedAt
			const existingFavorites = state.favorites.filter(f => f.id !== action.payload.favorite.id);
			return {
				...state,
				favorites: [...existingFavorites, action.payload.favorite],
			};
		case ActionType.RemoveFavorite:
			return {
				...state,
				favorites: state.favorites.filter(f => f.id !== action.payload.businessId),
			};
		case ActionType.HydrateFavorites:
			return {
				...state,
				favorites: action.payload.favorites,
			};
		case ActionType.AddHistory:
			// Dedupe by id, then normalize with stable sorting and cap
			const nextHistory = normalizeHistory([
				action.payload.history, 
				...state.history.filter(h => h.id !== action.payload.history.id)
			]);
			if (deepEqual(state.history, nextHistory)) return state;
			return {
				...state,
				history: nextHistory,
			};
		case ActionType.ClearHistory:
			if (state.history.length === 0) return state;
			return {
				...state,
				history: [],
			};
		case ActionType.HydrateHistory:
			const normalizedHistory = normalizeHistory(action.payload.history ?? []);
			if (deepEqual(state.history, normalizedHistory)) return state;
			return {
				...state,
				history: normalizedHistory,
			};
		case ActionType.AddSpinHistory:
			return {
				...state,
				spinHistory: [action.payload.spin, ...state.spinHistory.slice(0, 9)], // Keep last 10
			};
		case ActionType.SetSelectedBusiness:
			return {
				...state,
				selectedBusiness: action.payload.business,
			};
		case ActionType.ShowBusinessModal:
			return {
				...state,
				isBusinessModalOpen: true,
			};
		case ActionType.HideBusinessModal:
			return {
				...state,
				isBusinessModalOpen: false,
			};
		case ActionType.SetFilters:
			return {
				...state,
				filters: {
					...state.filters,
					...action.payload.filters,
				},
			};
		case ActionType.ResetFilters:
			return {
				...state,
				filters: initialFilters,
			};
		case ActionType.HydrateFilters:
			return {
				...state,
				filters: action.payload.filters,
			};
		default:
			return state;
	}
}

// helper functions to simplify the caller
export const setCategories = (categories: CategoryProps[]): SetCategories => ({
	type: ActionType.SetCategories,
	payload: { categories },
});

export const setDetail = (detail: BusinessProps): SetDetail => ({
	type: ActionType.SetDetail,
	payload: { detail },
});

export const setFilter = (filter: Filter): SetFilter => ({
	type: ActionType.SetFilter,
	payload: { filter },
});

export const setLocation = (location: string): SetLocation => ({
	type: ActionType.SetLocation,
	payload: { location },
});

export const setCoords = (coords: LocationObjectCoords | null): SetCoords => ({
	type: ActionType.SetCoords,
	payload: { coords },
});

export const setResults = (results: BusinessProps[]): SetResults => ({
	type: ActionType.SetResults,
	payload: { results },
});

export const setShowFilter = (showFilter: boolean): SetShowFilter => ({
	type: ActionType.SetShowFilter,
	payload: { showFilter },
});

export const addFavorite = (favorite: FavoriteItem): AddFavorite => ({
	type: ActionType.AddFavorite,
	payload: { favorite },
});

export const removeFavorite = (businessId: string): RemoveFavorite => ({
	type: ActionType.RemoveFavorite,
	payload: { businessId },
});

export const hydrateFavorites = (favorites: FavoriteItem[]): HydrateFavorites => ({
	type: ActionType.HydrateFavorites,
	payload: { favorites },
});

export const addHistory = (history: HistoryItem): AddHistory => ({
	type: ActionType.AddHistory,
	payload: { history },
});

export const clearHistory = (): ClearHistory => ({
	type: ActionType.ClearHistory,
});

export const hydrateHistory = (history: HistoryItem[]): HydrateHistory => ({
	type: ActionType.HydrateHistory,
	payload: { history },
});

export const addSpinHistory = (spin: SpinHistory): AddSpinHistory => ({
	type: ActionType.AddSpinHistory,
	payload: { spin },
});

export const setSelectedBusiness = (business: YelpBusiness | null): SetSelectedBusiness => ({
	type: ActionType.SetSelectedBusiness,
	payload: { business },
});

export const showBusinessModal = (): ShowBusinessModal => ({
	type: ActionType.ShowBusinessModal,
});

export const hideBusinessModal = (): HideBusinessModal => ({
	type: ActionType.HideBusinessModal,
});

export const setFilters = (filters: Partial<Filters>): SetFilters => ({
	type: ActionType.SetFilters,
	payload: { filters },
});

export const resetFilters = (): ResetFilters => ({
	type: ActionType.ResetFilters,
});

export const hydrateFilters = (filters: Filters): HydrateFilters => ({
	type: ActionType.HydrateFilters,
	payload: { filters },
});
