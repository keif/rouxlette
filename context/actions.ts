import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { Filter, SpinHistory } from "./state";
import { YelpBusiness } from "../types/yelp";

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
	SetSelectedBusiness,
	ShowBusinessModal,
	HideBusinessModal,
}

// String constants as requested
export const SET_SELECTED_BUSINESS = 'SET_SELECTED_BUSINESS' as const;
export const SHOW_BUSINESS_MODAL = 'SHOW_BUSINESS_MODAL' as const;
export const HIDE_BUSINESS_MODAL = 'HIDE_BUSINESS_MODAL' as const;

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

export interface SetSelectedBusiness {
	type: ActionType.SetSelectedBusiness;
	payload: { business: YelpBusiness | null };
}

export interface ShowBusinessModal {
	type: ActionType.ShowBusinessModal;
}

export interface HideBusinessModal {
	type: ActionType.HideBusinessModal;
}

export type AppActions = SetCategories | SetDetail | SetFilter | SetLocation | SetResults | SetShowFilter | AddFavorite | RemoveFavorite | AddSpinHistory | SetSelectedBusiness | ShowBusinessModal | HideBusinessModal;
