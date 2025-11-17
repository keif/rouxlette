import "react-native-get-random-values";
import { useState, useEffect, useCallback } from "react";
import yelp from "../api/yelp";
import { AxiosResponse } from "axios";
import useResultsPersistence from "./useResultsPersistence";
import { v4 as uuid } from "uuid";
import { logSafe, logArray, logNetwork } from "../utils/log";
import { LocationObjectCoords } from "expo-location";
import { ResolvedLocation } from "./useLocation";

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

export const INIT_RESULTS: ResultsProps = { id: ``, businesses: [] };

export default function useResults() {
	const [errorMessage, setErrorMessage] = useState<string>(``);
	const [results, setResults] = useState<ResultsProps>(INIT_RESULTS);
	const [isLoading, setIsLoading] = useState<boolean>(false);
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
	): Promise<BusinessProps[]> => {
		setIsLoading(true);
		try {
			devLog('Starting search:', { searchTerm, location, coords: coords ? `${coords.latitude},${coords.longitude}` : 'none' });
			setErrorMessage('');
			
			// First, try to get cached results
			const cachedResults = await resultsPersistence.getCachedResults(location, searchTerm, coords);
			if (cachedResults) {
				const businesses = Array.isArray(cachedResults) ? cachedResults : [];
				const cachedResultsObj: ResultsProps = {
					id: uuid(),
					businesses,
				};
				setResults(cachedResultsObj);
				logArray('useResults cached businesses', cachedResults, 3);
				return businesses;
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

			logNetwork('GET', '/businesses/search', searchParams, {
				status: response.status,
				data: response.data,
			});

			if (response.data && response.data.businesses) {
				// Ensure businesses is an array and filter out closed businesses
				const businessesArray = Array.isArray(response.data.businesses) ? response.data.businesses : [];
				const onlyOpenBusinesses = businessesArray.filter((business: BusinessProps) => {
					return !business.is_closed;
				});

				logArray('useResults filtered businesses', onlyOpenBusinesses, 3);

				// Create final results object
				const finalResults: ResultsProps = {
					id: uuid(),
					businesses: onlyOpenBusinesses,
				};

				// Cache the results (this is debounced and change-detected automatically)
				await resultsPersistence.cacheResults(location, searchTerm, onlyOpenBusinesses, coords);

				setResults(finalResults);
				return onlyOpenBusinesses;
			} else {
				devLog('No businesses in API response');
				setResults(INIT_RESULTS);
				return [];
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
			return [];
		} finally {
			setIsLoading(false);
		}
	}, [resultsPersistence]);

	/**
	 * Enhanced search API that resolves location ambiguity and prefers coordinates
	 * This addresses the "Powell, WY vs Powell, OH" problem by using location resolver
	 * 
	 * @param searchTerm - Restaurant/food search term  
	 * @param resolvedLocation - ResolvedLocation from location resolver
	 */
	const searchApiWithResolver = useCallback(async (
		searchTerm: string,
		resolvedLocation: ResolvedLocation
	): Promise<BusinessProps[]> => {
		setIsLoading(true);
		try {
			devLog('Enhanced search starting:', { 
				searchTerm, 
				location: resolvedLocation.label,
				coords: resolvedLocation.coords,
				source: resolvedLocation.source
			});
			setErrorMessage('');

			// Generate versioned cache key to avoid corrupted entries
			const cacheKey = resultsPersistence.generateCacheKey(
				resolvedLocation.label, 
				searchTerm, 
				resolvedLocation.coords
			);

			devLog('Using cache key:', cacheKey);

			// Try to get cached results with the specific cache key
			const cachedResults = await resultsPersistence.getCachedResultsByKey(cacheKey);
			if (cachedResults) {
				const businesses = Array.isArray(cachedResults) ? cachedResults : [];
				const cachedResultsObj: ResultsProps = {
					id: uuid(),
					businesses,
				};
				setResults(cachedResultsObj);
				logArray('Enhanced search cached businesses', cachedResults, 3);
				return businesses;
			}

			devLog('No cache found, making API request with resolved location...');

			// Build Yelp search parameters - prefer coordinates over location string
			const searchParams: any = { term: searchTerm, limit: 50 };
			
			if (resolvedLocation.coords?.latitude && resolvedLocation.coords?.longitude) {
				// PREFERRED: Use coordinates for most accurate search
				searchParams.latitude = resolvedLocation.coords.latitude;
				searchParams.longitude = resolvedLocation.coords.longitude;
				searchParams.radius = 1600; // ~1 mile in meters
				devLog('Using coordinates for Yelp search:', resolvedLocation.coords);
			} else if (resolvedLocation.label) {
				// FALLBACK: Use canonical location string (e.g., "Powell, OH")
				searchParams.location = resolvedLocation.label;
				devLog('Using canonical location string for Yelp search:', resolvedLocation.label);
			} else {
				devLog('No valid search location available');
				setResults(INIT_RESULTS);
				return;
			}

			// Make the Yelp API call
			const response: AxiosResponse = await yelp.get('/businesses/search', {
				params: searchParams
			});

			logNetwork('GET', '/businesses/search', searchParams, {
				status: response.status,
				data: response.data,
			});

			if (response.data && response.data.businesses) {
				// Ensure businesses is an array and filter out closed businesses
				const businessesArray = Array.isArray(response.data.businesses) ? response.data.businesses : [];
				const onlyOpenBusinesses = businessesArray.filter((business: BusinessProps) => {
					return !business.is_closed;
				});

				logArray('Enhanced search filtered businesses', onlyOpenBusinesses, 3);

				// Create final results object
				const finalResults: ResultsProps = {
					id: uuid(),
					businesses: onlyOpenBusinesses,
				};

				// Cache the results with the specific cache key
				await resultsPersistence.cacheResultsByKey(cacheKey, onlyOpenBusinesses);

				setResults(finalResults);
				return onlyOpenBusinesses;
			} else {
				devLog('No businesses in API response');
				setResults(INIT_RESULTS);
				return [];
			}
		} catch (err: any) {
			logSafe(`[useResults] searchApiWithResolver error`, { 
				message: err?.message, 
				status: err?.response?.status,
				code: err?.code,
				location: resolvedLocation.label
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
			return [];
		} finally {
			setIsLoading(false);
		}
	}, [resultsPersistence]);

	// Clean up old cache entries periodically (optional)
	useEffect(() => {
		const cleanupInterval = setInterval(() => {
			resultsPersistence.clearOldCache(24); // Clear entries older than 24 hours
		}, 60 * 60 * 1000); // Run every hour

		return () => clearInterval(cleanupInterval);
	}, [resultsPersistence]);

	return [errorMessage, results, searchApi, searchApiWithResolver, isLoading] as const;
}