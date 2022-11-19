import { CategoryProps, BusinessProps } from "../hooks/useResults";

export interface AppState {
	categories: CategoryProps[],
	detail: BusinessProps | null;
	filter: Filter;
	location: string;
	results: BusinessProps[];
	showFilter: boolean;
}

export interface Filter {
	category?: CategoryProps[];
	distance?: string;
	price?: number[];
}

export const initialAppState: AppState = {
	categories: [],
	detail: null,
	filter: {} as Filter,
	location: ``,
	results: [],
	showFilter: false,
}
