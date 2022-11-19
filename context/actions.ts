import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { Filter } from "./state";

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

export type AppActions = SetCategories | SetDetail | SetFilter | SetLocation | SetResults | SetShowFilter;
