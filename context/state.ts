import { CategoryProps, BusinessProps } from "../hooks/useResults";

export interface SpinHistory {
	restaurant: BusinessProps;
	timestamp: number;
}

export interface AppState {
	categories: CategoryProps[],
	detail: BusinessProps | null;
	filter: Filter;
	location: string;
	results: BusinessProps[];
	showFilter: boolean;
	favorites: BusinessProps[];
	spinHistory: SpinHistory[];
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
	favorites: [],
	spinHistory: [],
}
