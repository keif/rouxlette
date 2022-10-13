import { AppState } from "./state";
import { ActionType, AppActions, SetCategories, SetDetail, SetFilter, SetLocation, SetResults } from "./actions";
import { Result } from "../hooks/useResults";

export function appReducer(state: AppState, action: AppActions): AppState {
	switch (action.type) {
		case ActionType.SetCategories:
			return {
				...state,
				categories: state.categories,
			}
		case ActionType.SetDetail:
			return {
				...state,
				detail: state.detail,
			};
		case ActionType.SetFilter:
			return {
				...state,
				filter: state.filter,
			}
		case ActionType.SetLocation:
			return {
				...state,
				location: state.location,
			};
		case ActionType.SetResults:
			return {
				...state,
				results: state.results,
			};
		default:
			return state;
	}
}

// helper functions to simplify the caller
export const setCategories = (categories: string[]): SetCategories => ({
	type: ActionType.SetCategories,
	payload: { categories },
});

export const setDetail = (detail: Result): SetDetail => ({
	type: ActionType.SetDetail,
	payload: { detail },
});

export const setFilter = (filter: string): SetFilter => ({
	type: ActionType.SetFilter,
	payload: { filter },
})
export const setLocation = (location: string): SetLocation => ({
	type: ActionType.SetLocation,
	payload: { location },
});

export const setResults = (results: Result[]): SetResults => ({
	type: ActionType.SetResults,
	payload: { results },
});
