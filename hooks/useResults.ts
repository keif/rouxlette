import "react-native-get-random-values";
import { useState, useEffect, useCallback } from "react";
import useResultsPersistence from "./useResultsPersistence";
import { v4 as uuid } from "uuid";
import { logSafe, logArray } from "../utils/log";
import { LocationObjectCoords } from "expo-location";
import { ResolvedLocation } from "./useLocation";
import { hasBlockedCategory } from "../constants/foodCategories";
import { DEFAULT_PROVIDERS, searchRestaurants } from "../providers";

export const PRICE_OPTIONS = [`$`, `$$`, `$$$`, `$$$$`];

// Yelp caps its search radius at 40,000 m (~25 mi). The distance slider clamps
// too, but this is the API boundary so we guard here as well (#55).
const YELP_MAX_RADIUS_METERS = 40000;
const DEFAULT_RADIUS_METERS = 1600; // ~1 mile

const clampRadius = (radiusMeters: number): number =>
	Math.min(YELP_MAX_RADIUS_METERS, Math.max(1, Math.round(radiusMeters)));

/**
 * Uniform post-filter applied to whatever provider the registry used: drop
 * permanently-closed businesses and non-food categories (body shops, etc.).
 * This preserves the behavior the inline Yelp path had before the provider
 * abstraction, now applied to any provider's results.
 */
function keepFoodAndOpen(businesses: BusinessProps[]): BusinessProps[] {
	return businesses.filter(business => {
		if (business.is_closed) return false;
		const categoryAliases = business.categories?.map(c => c.alias) || [];
		if (hasBlockedCategory(categoryAliases)) return false;
		return true;
	});
}

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
		coords: LocationObjectCoords | null = null,
		radiusMeters: number = DEFAULT_RADIUS_METERS
	): Promise<BusinessProps[]> => {
		setIsLoading(true);
		const radius = clampRadius(radiusMeters);
		try {
			devLog('Starting search:', { searchTerm, location, coords: coords ? `${coords.latitude},${coords.longitude}` : 'none' });
			setErrorMessage('');
			
			// First, try to get cached results
			const cachedResults = await resultsPersistence.getCachedResults(location, searchTerm, coords, radius);
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

			devLog('No cache found, routing through provider registry...');

			// Guard: without coordinates or a usable location string there is
			// nothing to search. Preserves the prior invalid-params early return.
			const hasCoords = !!(coords?.latitude && coords?.longitude);
			if (!hasCoords && location.trim() === '') {
				devLog('Invalid search parameters');
				setResults(INIT_RESULTS);
				return;
			}

			// Try Yelp, then fall back to OpenStreetMap. clampRadius stays in the
			// hook: the Yelp adapter forwards radius raw, so we pass the already
			// clamped value to preserve the Yelp 40km max guard (#55).
			const outcome = await searchRestaurants(DEFAULT_PROVIDERS, {
				term: searchTerm,
				coordinates: hasCoords ? coords : null,
				locationLabel: location,
				radiusMeters: radius,
			});

			// Apply the closed/non-food post-filter uniformly to whatever the
			// used provider returned.
			const filteredBusinesses = keepFoodAndOpen(outcome.results);
			logArray('useResults filtered businesses', filteredBusinesses, 3);

			const finalResults: ResultsProps = {
				id: uuid(),
				businesses: filteredBusinesses,
			};

			// Cache only when the used provider allows it.
			const usedCacheable =
				DEFAULT_PROVIDERS.find(p => p.id === outcome.usedProvider)?.cachePolicy === 'cacheable';
			if (usedCacheable) {
				// Debounced and change-detected automatically.
				await resultsPersistence.cacheResults(location, searchTerm, filteredBusinesses, coords, radius);
			}

			setResults(finalResults);
			return filteredBusinesses;
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
			// Propagate the failure so callers can distinguish it from a genuine
			// empty result set (an empty [] is a valid, committable search) — the
			// screens clear the committed search identity on the thrown error (#58).
			throw err;
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
		resolvedLocation: ResolvedLocation,
		radiusMeters: number = DEFAULT_RADIUS_METERS
	): Promise<BusinessProps[]> => {
		setIsLoading(true);
		const radius = clampRadius(radiusMeters);
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
				resolvedLocation.coords,
				radius
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

			devLog('No cache found, routing through provider registry...');

			// Prefer coordinates over the location label; the OSM fallback requires
			// coordinates. clampRadius stays in the hook (see searchApi note) so the
			// Yelp adapter receives an already-clamped radius (#55).
			const hasCoords = !!(resolvedLocation.coords?.latitude && resolvedLocation.coords?.longitude);
			if (!hasCoords && !resolvedLocation.label) {
				devLog('No valid search location available');
				setResults(INIT_RESULTS);
				return;
			}

			const outcome = await searchRestaurants(DEFAULT_PROVIDERS, {
				term: searchTerm,
				coordinates: hasCoords ? resolvedLocation.coords : null,
				locationLabel: resolvedLocation.label,
				radiusMeters: radius,
			});

			// Apply the closed/non-food post-filter uniformly to whatever the used
			// provider returned.
			const filteredBusinesses = keepFoodAndOpen(outcome.results);
			logArray('Enhanced search filtered businesses', filteredBusinesses, 3);

			const finalResults: ResultsProps = {
				id: uuid(),
				businesses: filteredBusinesses,
			};

			// Cache (by the versioned key) only when the used provider allows it.
			const usedCacheable =
				DEFAULT_PROVIDERS.find(p => p.id === outcome.usedProvider)?.cachePolicy === 'cacheable';
			if (usedCacheable) {
				await resultsPersistence.cacheResultsByKey(cacheKey, filteredBusinesses);
			}

			setResults(finalResults);
			return filteredBusinesses;
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
			// Propagate the failure so callers can distinguish it from an empty
			// (but valid) result set and clear the committed search identity (#58).
			throw err;
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