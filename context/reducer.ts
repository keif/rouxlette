import { AppState, Filter } from "./state";
import {
	ActionType,
	AppActions,
	SetCategories,
	SetDetail,
	SetFilter,
	SetLocation,
	SetResults,
	SetShowFilter,
} from "./actions";
import { CategoryProps, BusinessProps } from "../hooks/useResults";

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
