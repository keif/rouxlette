import "react-native-get-random-values";
import { useState } from "react";
import yelp from "../api/yelp";
import { AxiosResponse } from "axios";
import useStorage from "./useStorage";
import { v4 as uuid } from "uuid";

export const PRICE_OPTIONS = [`$`, `$$`, `$$$`, `$$$$`];

export interface ResultsProps {
	id: string;
	businesses: BusinessProps[];
}

export interface BusinessProps {
	alias: string;
	categories: CategoryProps[];
	coordinates: CoordinatesProps;
	display_phone: string;
	distance: number;
	hours?: HoursProps[];
	id: string;
	image_url: string;
	is_closed: boolean;
	location: LocationProps;
	name: string;
	phone: string;
	photos: string[];
	price: string;
	rating: number;
	review_count: number;
	transactions: string[];
	url: string;
}

export interface CategoryProps {
	alias: string;
	title: string;
}

export interface CoordinatesProps {
	latitude: number;
	longitude: number;
}

export interface HoursProps {
	hours_type: string;
	is_open_now: boolean;
	open: OpenProps[];
}

export interface OpenProps {
	day: number;
	end: string;
	is_overnight: boolean;
	start: string;
}

export interface LocationProps {
	address1: string;
	address2: null;
	address3: string;
	city: string;
	country: string;
	display_address: string[];
	state: string;
	zip_code: string;
}

export const INIT_RESULTS = { id: ``, businesses: [] };
export default () => {
	const [errorMessage, setErrorMessage] = useState<string>(``);
	const [results, setResults] = useState<ResultsProps | { id: string; businesses: [] }>(INIT_RESULTS);
	const [deleteItem, getAllItems, getItem, setItem] = useStorage();

	const searchApi = async (searchTerm: string, location = `columbus`) => {
		const key = `${searchTerm}:${location}`;

		if (searchTerm.trim() !== `` && location.trim() !== ``) {
			try {
				const cache = await getItem(key);

				if (cache) {
					if (typeof cache === `string`) {
						const finalResults = {
							id: uuid(),
							businesses: [...JSON.parse(cache)],
						};
						setResults(finalResults);
					} else {
						const finalResults = {
							id: uuid(),
							businesses: [...cache],
						};
						setResults(finalResults);
					}
				} else {
					const response: AxiosResponse = await yelp.get(`/search`, {
						params: {
							limit: 50,
							location: location,
							term: searchTerm,
						},
					});

					const onlyOpenBusinesses = response.data.businesses.filter((business: BusinessProps) => !business.is_closed);
					const finalResults = {
						id: uuid(),
						businesses: [...onlyOpenBusinesses],
					};
					await setItem(key, onlyOpenBusinesses);
					setResults(finalResults);
				}
			} catch (err) {
				console.error(`searchApi: error:`, err);
				setErrorMessage(`There was an error, please try again`);
				setTimeout(() => setErrorMessage(``), 3000);
			}
		} else {
			setResults(INIT_RESULTS);
		}
	};

	return [errorMessage, results, searchApi] as const;
}
