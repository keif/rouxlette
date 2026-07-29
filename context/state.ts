import { CategoryProps, BusinessProps } from "../hooks/useResults";
import { YelpBusiness } from "../types/yelp";
import { FavoriteItem, HistoryItem } from "../types/favorites";
import { LocationObjectCoords } from "expo-location";

export interface SpinHistory {
	restaurant: BusinessProps;
	timestamp: number;
}

// The committed search identity for the currently-displayed results: the term,
// coordinates, and radius the results were actually fetched with. Shared across
// screens (Home ⇄ Search) so radius reconciliation has one source of truth
// instead of per-screen refs (#58).
export interface LastSearch {
	term: string;
	coords: { latitude: number; longitude: number } | null;
	radiusMeters: number;
}

export interface AppState {
	categories: CategoryProps[],
	detail: BusinessProps | null;
	filter: Filter;
	filters: Filters;
	location: string;
	currentCoords: LocationObjectCoords | null;
	rawResults: BusinessProps[]; // Unfiltered results from API
	results: BusinessProps[]; // Filtered results
	showFilter: boolean;
	favorites: FavoriteItem[];
	blocked: FavoriteItem[];
	history: HistoryItem[];
	spinHistory: SpinHistory[];
	selectedBusiness: YelpBusiness | null;
	isBusinessModalOpen: boolean;
	lastSearch: LastSearch | null;
}

export interface Filter {
	category?: CategoryProps[];
	distance?: string;
	price?: number[];
}

export interface Filters {
	categoryIds: string[];        // Yelp alias ids (inclusion filter)
	excludedCategoryIds: string[]; // Yelp alias ids (exclusion filter)
	priceLevels: Array<1|2|3|4>;  // $, $$, $$$, $$$$
	openNow: boolean;
	radiusMeters: number;         // e.g., 1600 default ~1 mile
	minRating: number;            // 0–5
}

export const initialFilters: Filters = {
	categoryIds: [],
	excludedCategoryIds: [],
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
	currentCoords: null,
	rawResults: [],
	results: [],
	showFilter: false,
	favorites: [],
	blocked: [],
	history: [],
	spinHistory: [],
	selectedBusiness: null,
	isBusinessModalOpen: false,
	lastSearch: null,
}
