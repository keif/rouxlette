import { Category, Result } from "../hooks/useResults";

export interface AppState {
	categories: Category[],
	detail: Result | null;
	filter: Filter;
	location: string;
	results: Result[];
	showFilter: boolean;
}

export interface Filter {
	category: Category[];
	distance: string;
	price: string;
}

export const initialAppState: AppState = {
	categories: [],
	detail: null,
	filter: null,
	location: ``,
	results: [],
	showFilter: false,
}
