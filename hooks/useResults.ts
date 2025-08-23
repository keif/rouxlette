import "react-native-get-random-values";
import { useState, useEffect } from "react";
import yelp from "../api/yelp";
import { AxiosResponse } from "axios";
import useStorage from "./useStorage";
import { v4 as uuid } from "uuid";
import { LocationObjectCoords } from "expo-location";

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

	// Dev logging helper
	const devLog = (message: string, ...args: any[]) => {
		if (__DEV__) {
			console.log(`[useResults] ${message}`, ...args);
		}
	};

	// Normalize coordinates to avoid cache thrashing
	const normalizeCoords = (coords: LocationObjectCoords | null) => {
		if (!coords) return null;
		return {
			lat: Math.round(coords.latitude * 10000) / 10000, // 4 decimal precision ~11m accuracy
			lng: Math.round(coords.longitude * 10000) / 10000,
		};
	};

	// Generate cache key from term and coordinates
	const getCacheKey = (searchTerm: string, coords: LocationObjectCoords | null, location?: string) => {
		if (coords) {
			const normalized = normalizeCoords(coords);
			const key = `${searchTerm}:${normalized?.lat},${normalized?.lng}`;
			devLog('Using coords-based cache key:', key);
			return key;
		}
		
		// Fallback to location string if no coords
		const key = `${searchTerm}:${location || 'unknown'}`;
		devLog('Using location-string cache key:', key);
		return key;
	};

	const searchApi = async (searchTerm: string, location = `columbus`, coords: LocationObjectCoords | null = null) => {
		devLog('searchApi called with:', { searchTerm, location, coords: normalizeCoords(coords) });
		
		const key = getCacheKey(searchTerm, coords, location);

		if (searchTerm.trim() !== `` && (location.trim() !== `` || coords)) {
			try {
				const cache = await getItem(key);

				if (cache) {
					devLog('Using cached results for key:', key);
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
					devLog('Fetching fresh results from Yelp API');
					
					// Prepare search parameters
					const searchParams: any = {
						limit: 50,
						term: searchTerm,
					};

					// Use coordinates if available, otherwise fall back to location string
					if (coords) {
						searchParams.latitude = coords.latitude;
						searchParams.longitude = coords.longitude;
						devLog('Using coordinates for Yelp search:', coords);
					} else {
						searchParams.location = location;
						devLog('Using location string for Yelp search:', location);
					}

					const response: AxiosResponse = await yelp.get(`/search`, {
						params: searchParams,
					});

					devLog('Yelp API response received, business count:', response.data.businesses?.length || 0);

					const onlyOpenBusinesses = response.data.businesses.filter((business: BusinessProps) => !business.is_closed);
					const finalResults = {
						id: uuid(),
						businesses: [...onlyOpenBusinesses],
					};
					
					devLog('Filtered to open businesses:', onlyOpenBusinesses.length, 'caching with key:', key);
					await setItem(key, onlyOpenBusinesses);
					setResults(finalResults);
				}
			} catch (err) {
				console.error(`searchApi: error:`, err);
				devLog('Search API error:', err);
				setErrorMessage(`There was an error, please try again`);
				setTimeout(() => setErrorMessage(``), 3000);
			}
		} else {
			devLog('Invalid search parameters, resetting results');
			setResults(INIT_RESULTS);
		}
	};

	return [errorMessage, results, searchApi] as const;
}