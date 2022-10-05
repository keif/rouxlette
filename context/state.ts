import { Result } from "../hooks/useResults";

export interface AppState {
	detail: Result | null;
	location: string;
	results: Result[];
}

export const initialAppState: AppState = {
	detail: null,
	location: ``,
	results: [],
}
