import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { Filter, SpinHistory } from "./state";

export enum ActionType {
	SetCategories,
	SetDetail,
	SetFilter,
	SetLocation,
	SetResults,
	SetShowFilter,
	AddFavorite,
	RemoveFavorite,
	AddSpinHistory,
}

export interface SetCategories {
	type: ActionType.SetCategories;
	payload: { categories: CategoryProps[] }
}

export interface SetDetail {
	type: ActionType.SetDetail;
	payload: { detail: BusinessProps };
}

export interface SetFilter {
	type: ActionType.SetFilter;
	payload: { filter: Filter }
}

export interface SetLocation {
	type: ActionType.SetLocation;
	payload: { location: string };
}

export interface SetResults {
	type: ActionType.SetResults;
	payload: { results: BusinessProps[] };
}

export interface SetShowFilter {
	type: ActionType.SetShowFilter;
	payload: { showFilter: boolean; };
}

export interface AddFavorite {
	type: ActionType.AddFavorite;
	payload: { restaurant: BusinessProps };
}

export interface RemoveFavorite {
	type: ActionType.RemoveFavorite;
	payload: { restaurantId: string };
}

export interface AddSpinHistory {
	type: ActionType.AddSpinHistory;
	payload: { spin: SpinHistory };
}

export type AppActions = SetCategories | SetDetail | SetFilter | SetLocation | SetResults | SetShowFilter | AddFavorite | RemoveFavorite | AddSpinHistory;
