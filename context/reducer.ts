import { AppState, Filter, SpinHistory } from "./state";
import {
	ActionType,
	AppActions,
	SetCategories,
	SetDetail,
	SetFilter,
	SetLocation,
	SetResults,
	SetShowFilter,
	AddFavorite,
	RemoveFavorite,
	AddSpinHistory,
	SetSelectedBusiness,
	ShowBusinessModal,
	HideBusinessModal,
} from "./actions";
import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { YelpBusiness } from "../types/yelp";

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
			console.log(`SetFilter: `, action.type, `action.payload: `, action.payload);
			return {
				...state,
				filter: {
					...state.filter,
					...action.payload.filter
				},
			};
		case ActionType.SetLocation:
			return {
				...state,
				location: action.payload.location,
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
			return {
				...state,
				favorites: [...state.favorites, action.payload.restaurant],
			};
		case ActionType.RemoveFavorite:
			return {
				...state,
				favorites: state.favorites.filter(r => r.id !== action.payload.restaurantId),
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

export const setResults = (results: BusinessProps[]): SetResults => ({
	type: ActionType.SetResults,
	payload: { results },
});

export const setShowFilter = (showFilter: boolean): SetShowFilter => ({
	type: ActionType.SetShowFilter,
	payload: { showFilter },
});

export const addFavorite = (restaurant: BusinessProps): AddFavorite => ({
	type: ActionType.AddFavorite,
	payload: { restaurant },
});

export const removeFavorite = (restaurantId: string): RemoveFavorite => ({
	type: ActionType.RemoveFavorite,
	payload: { restaurantId },
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
