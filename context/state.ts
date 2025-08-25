import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { YelpBusiness } from "../types/yelp";

export interface SpinHistory {
	restaurant: BusinessProps;
	timestamp: number;
}

export interface AppState {
	categories: CategoryProps[],
	detail: BusinessProps | null;
	filter: Filter;
	filters: Filters;
	location: string;
	results: BusinessProps[];
	showFilter: boolean;
	favorites: BusinessProps[];
	spinHistory: SpinHistory[];
	selectedBusiness: YelpBusiness | null;
	isBusinessModalOpen: boolean;
}

export interface Filter {
	category?: CategoryProps[];
	distance?: string;
	price?: number[];
}

export interface Filters {
	categoryIds: string[];        // Yelp alias ids
	priceLevels: Array<1|2|3|4>;  // $, $$, $$$, $$$$
	openNow: boolean;
	radiusMeters: number;         // e.g., 1600 default ~1 mile
	minRating: number;            // 0–5
}

export const initialFilters: Filters = {
	categoryIds: [],
	priceLevels: [],
	openNow: false,
	radiusMeters: 1600, // ~1 mile default
	minRating: 0,
};

export const initialAppState: AppState = {
	categories: [],
	detail: null,
	filter: {} as Filter,
	filters: initialFilters,
	location: ``,
	results: [],
	showFilter: false,
	favorites: [],
	spinHistory: [],
	selectedBusiness: null,
	isBusinessModalOpen: false,
}
