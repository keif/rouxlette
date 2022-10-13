import { Result } from "../hooks/useResults";

export interface AppState {
	categories: string[],
	detail: Result | null;
	filter: any;
	location: string;
	results: Result[];
}

export const initialAppState: AppState = {
	categories: [],
	detail: null,
	filter: null,
	location: ``,
	results: [],
}
