import { Result } from "../hooks/useResults";

export interface AppState {
	detail: Result | null;
	filter: any;
	location: string;
	results: Result[];
}

export const initialAppState: AppState = {
	detail: null,
	filter: null,
	location: ``,
	results: [],
}
