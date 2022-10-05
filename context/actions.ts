import { Result } from "../hooks/useResults";

export enum ActionType {
	SetDetail,
	SetLocation,
	SetResults,
}

export interface SetDetail {
	type: ActionType.SetDetail;
	payload: { detail: Result };
}

export interface SetLocation {
	type: ActionType.SetLocation;
	payload: { location: string };
}

export interface SetResults {
	type: ActionType.SetResults;
	payload: { results: Result[] };
}

export type AppActions = SetDetail | SetLocation | SetResults;
