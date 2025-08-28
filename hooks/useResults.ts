import "react-native-get-random-values";
import { useState, useEffect, useCallback } from "react";
import yelp from "../api/yelp";
import { AxiosResponse } from "axios";
import useResultsPersistence from "./useResultsPersistence";
import { v4 as uuid } from "uuid";
import { logSafe, logArray, logNetwork } from "../utils/log";
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

export default function useResults() {
	const [errorMessage, setErrorMessage] = useState<string>(``);
	const [results, setResults] = useState<ResultsProps | { id: string; businesses: [] }>(INIT_RESULTS);
	const resultsPersistence = useResultsPersistence();

	// Dev logging helper
	const devLog = (message: string, ...args: any[]) => {
		if (__DEV__) {
			logSafe(`[useResults] ${message}`, ...args);
		}
	};

	const searchApi = useCallback(async (
		searchTerm: string, 
		location = `columbus`, 
		coords: LocationObjectCoords | null = null
	) => {
		try {
			devLog('Starting search:', { searchTerm, location, coords: coords ? `${coords.latitude},${coords.longitude}` : 'none' });
			setErrorMessage('');
			
			// First, try to get cached results
			const cachedResults = await resultsPersistence.getCachedResults(location, searchTerm, coords);
			if (cachedResults) {
				const cachedResultsObj = {
					id: uuid(),
					businesses: cachedResults,
				};
				setResults(cachedResultsObj);
				logArray('useResults cached businesses', cachedResults, { limit: 3 });
				return;
			}

			devLog('No cache found, making API request...');

			// Determine search parameters
			let searchParams: any = { term: searchTerm, limit: 50 };
			
			if (coords?.latitude && coords?.longitude) {
				// Use coordinates for more accurate search
				searchParams.latitude = coords.latitude;
				searchParams.longitude = coords.longitude;
				searchParams.radius = 1600; // ~1 mile in meters
				devLog('Using coordinates for search:', coords);
			} else if (location.trim() !== '') {
				// Fallback to location string
				searchParams.location = location;
				devLog('Using location string for search:', location);
			} else {
				devLog('Invalid search parameters');
				setResults(INIT_RESULTS);
				return;
			}

			// Make the API call
			const response: AxiosResponse = await yelp.get('/businesses/search', {
				params: searchParams
			});

			logNetwork('useResults API response', {
				businessCount: response.data.businesses?.length || 0,
				status: response.status,
				url: response.config?.url
			});

			if (response.data && response.data.businesses) {
				// Filter out closed businesses
				const onlyOpenBusinesses = response.data.businesses.filter((business: BusinessProps) => {
					return !business.is_closed;
				});

				logArray('useResults filtered businesses', onlyOpenBusinesses, { limit: 3 });

				// Create final results object
				const finalResults = {
					id: uuid(),
					businesses: [...onlyOpenBusinesses],
				};

				// Cache the results (this is debounced and change-detected automatically)
				await resultsPersistence.cacheResults(location, searchTerm, onlyOpenBusinesses, coords);
				
				setResults(finalResults);
			} else {
				devLog('No businesses in API response');
				setResults(INIT_RESULTS);
			}
		} catch (err: any) {
			logSafe(`[useResults] searchApi error`, { 
				message: err?.message, 
				status: err?.response?.status,
				code: err?.code 
			});
			
			// Set user-friendly error message
			if (err.response?.status === 429) {
				setErrorMessage('Too many requests. Please wait a moment and try again.');
			} else if (err.response?.status === 400) {
				setErrorMessage('Invalid search parameters. Please check your location and try again.');
			} else if (err.code === 'NETWORK_ERROR' || !err.response) {
				setErrorMessage('Network error. Please check your internet connection.');
			} else {
				setErrorMessage('Search failed. Please try again.');
			}
			
			setResults(INIT_RESULTS);
		}
	}, [resultsPersistence]);

	// Clean up old cache entries periodically (optional)
	useEffect(() => {
		const cleanupInterval = setInterval(() => {
			resultsPersistence.clearOldCache(24); // Clear entries older than 24 hours
		}, 60 * 60 * 1000); // Run every hour

		return () => clearInterval(cleanupInterval);
	}, [resultsPersistence]);

	return [errorMessage, results, searchApi] as const;
}