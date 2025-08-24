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

export const initialAppState: AppState = {
	categories: [],
	detail: null,
	filter: {} as Filter,
	location: ``,
	results: [],
	showFilter: false,
	favorites: [],
	spinHistory: [],
	selectedBusiness: null,
	isBusinessModalOpen: false,
}
