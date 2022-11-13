import { Category, Result } from "../hooks/useResults";

export enum ActionType {
	SetCategories,
	SetDetail,
	SetFilter,
	SetLocation,
	SetResults,
	SetShowFilter,
}

export interface SetCategories {
	type: ActionType.SetCategories;
	payload: { categories: Category[] }
}

export interface SetDetail {
	type: ActionType.SetDetail;
	payload: { detail: Result };
}

export interface SetFilter {
	type: ActionType.SetFilter;
	payload: { filter: string }
}

export interface SetLocation {
	type: ActionType.SetLocation;
	payload: { location: string };
}

export interface SetResults {
	type: ActionType.SetResults;
	payload: { results: Result[] };
}

export interface SetShowFilter {
	type: ActionType.SetShowFilter;
	payload: { showFilter: boolean; };
}

export type AppActions = SetCategories | SetDetail | SetFilter | SetLocation | SetResults | SetShowFilter;
