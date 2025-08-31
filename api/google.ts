import axios from "axios";
import { GOOGLE_API_KEY } from "@env";
import { logSafe, logNetwork } from "../utils/log";

const GOOGLE_MAP_URL: string = `https://maps.googleapis.com/maps/api/geocode/json`;

// Normalized response type for all geocoding operations
export interface GeocodeResponse {
	ok: boolean;                // status === 'OK'
	status: string;             // raw status or 'EMPTY_QUERY'
	errorMessage?: string;      // error_message if present
	results: Array<any>;        // always an array (default [])
	raw: any;                   // original json
}

const google = axios.create({
	baseURL: GOOGLE_MAP_URL,
	// Note: Google Geocoding API uses API key as query parameter, not Authorization header
	timeout: 10000, // 10 second timeout
});

google.interceptors.request.use(function (config) {
	// Add API key as query parameter for Google Geocoding API
	if (GOOGLE_API_KEY) {
		config.params = {
			...config.params,
			key: GOOGLE_API_KEY
		};
	} else {
		logSafe('GOOGLE_API_KEY not found in environment variables');
	}
	
	logSafe('Google API request', {
		url: config.url,
		params: config.params ? Object.keys(config.params) : [],
		baseURL: config.baseURL
	});
	
	return config;
}, function (error) {
	logSafe('Google API request error', { message: error?.message, code: error?.code });
	return Promise.reject(error);
});

google.interceptors.response.use(function (response) {
	logSafe('Google API response', {
		status: response.status,
		resultsCount: response.data?.results?.length || 0,
		responseStatus: response.data?.status
	});
	return response;
}, function (error) {
	logSafe('Google API response error', {
		message: error?.message,
		status: error?.response?.status,
		errorStatus: error?.response?.data?.status
	});
	return Promise.reject(error);
});

/**
 * Normalizes Google Geocoding API responses to a consistent format
 * Handles edge cases like empty queries, array responses, and various error states
 */
export async function geocode(query: string | null | undefined): Promise<GeocodeResponse> {
	const q = (query ?? '').trim();
	
	// Guard against empty queries - return early without making API call
	if (!q) {
		logSafe('geocode: Empty query provided, returning EMPTY_QUERY status');
		return { 
			ok: false, 
			status: 'EMPTY_QUERY', 
			results: [], 
			raw: null, 
			errorMessage: 'No query provided' 
		};
	}

	try {
		logSafe('geocode: Making API request for query', { query: q });
		const response = await google.get('', {
			params: { address: q }
		});

		const json = response.data;
		logSafe('geocode: API response', {
			status: json?.status,
			resultsCount: Array.isArray(json?.results) ? json.results.length : (Array.isArray(json) ? json.length : 0)
		});

		// Handle case where API returns an array at top level (some Google APIs do this)
		const isArrayTop = Array.isArray(json);
		
		if (isArrayTop) {
			logSafe('geocode: Detected array-level response, normalizing', { arrayLength: json.length });
			const status = json.length > 0 ? 'OK' : 'ZERO_RESULTS';
			return {
				ok: status === 'OK',
				status,
				results: json,
				raw: json,
				errorMessage: json.length === 0 ? 'No results found' : undefined
			};
		}

		// Handle standard Google Geocoding API response format
		const status = json.status ?? 'UNKNOWN';
		const results = Array.isArray(json.results) ? json.results : [];
		const errorMessage = json.error_message;

		logSafe('geocode: Normalized response', { status, resultsCount: results.length, hasError: !!errorMessage });

		return {
			ok: status === 'OK',
			status,
			results,
			raw: json,
			errorMessage
		};

	} catch (error: any) {
		logSafe('geocode: Network or parsing error', { message: error?.message, code: error?.code });
		
		// Handle network errors or API failures
		return {
			ok: false,
			status: 'NETWORK_ERROR',
			results: [],
			raw: null,
			errorMessage: error.message || 'Network error occurred'
		};
	}
}

/**
 * Reverse geocode coordinates to get address information
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResponse> {
	const latlng = `${latitude},${longitude}`;
	logSafe('reverseGeocode: Converting coordinates to address', { latlng });
	
	try {
		const response = await google.get('', {
			params: { latlng }
		});

		const json = response.data;
		logSafe('reverseGeocode: API response', {
			status: json?.status,
			resultsCount: Array.isArray(json?.results) ? json.results.length : (Array.isArray(json) ? json.length : 0)
		});

		// Handle array response (some endpoints return arrays)
		const isArrayTop = Array.isArray(json);
		
		if (isArrayTop) {
			const status = json.length > 0 ? 'OK' : 'ZERO_RESULTS';
			return {
				ok: status === 'OK',
				status,
				results: json,
				raw: json,
				errorMessage: json.length === 0 ? 'No results found for coordinates' : undefined
			};
		}

		// Standard response format
		const status = json.status ?? 'UNKNOWN';
		const results = Array.isArray(json.results) ? json.results : [];

		return {
			ok: status === 'OK',
			status,
			results,
			raw: json,
			errorMessage: json.error_message
		};

	} catch (error: any) {
		logSafe('reverseGeocode: Error', { message: error?.message, code: error?.code });
		return {
			ok: false,
			status: 'NETWORK_ERROR',
			results: [],
			raw: null,
			errorMessage: error.message || 'Network error occurred'
		};
	}
}

/**
 * Converts geocoding error status to user-friendly message
 */
export function humanizeGeocodeError(response: GeocodeResponse): string {
	switch (response.status) {
		case 'EMPTY_QUERY':
			return 'Please enter a location to search';
		case 'ZERO_RESULTS':
			return 'No results found for that location';
		case 'REQUEST_DENIED':
			return 'Location service unavailable. Please try again later.';
		case 'INVALID_REQUEST':
			return 'Invalid location format. Please try a different search.';
		case 'OVER_QUERY_LIMIT':
			return 'Location service is busy. Please try again in a moment.';
		case 'NETWORK_ERROR':
			return 'Network error. Please check your connection and try again.';
		case 'UNKNOWN_ERROR':
			return 'An unexpected error occurred. Please try again.';
		default:
			return response.errorMessage || 'Location search failed. Please try again.';
	}
}

// Enhanced geocoding with bias and components support for location disambiguation
type Coords = { latitude: number; longitude: number };

/**
 * Generate bounds string for Google Geocoding API from center point
 * Creates a bounding box around the center with specified radius in kilometers
 */
function boundsFromCenter(center: Coords, km = 50): string {
	// Approximately 111 km per degree latitude; longitude scaled by cos(lat)
	const latDelta = km / 111;
	const lonDelta = km / (111 * Math.cos((center.latitude * Math.PI) / 180) || 1);
	
	const south = center.latitude - latDelta;
	const west = center.longitude - lonDelta;
	const north = center.latitude + latDelta;
	const east = center.longitude + lonDelta;
	
	// Google bounds format: south,west|north,east
	return `${south},${west}|${north},${east}`;
}

/**
 * Enhanced geocoding function with country/state components and bounds bias
 * Helps resolve ambiguous location names like "Powell" to the correct city
 */
export async function geocodeAddress(address: string, opts?: {
	biasCenter?: Coords;   // from device location to bias results
	country?: string;      // e.g. 'US'
	state?: string;        // e.g. 'OH' 
	kmBias?: number;       // radius for bounds bias (default 50)
}): Promise<GeocodeResponse> {
	const q = (address ?? '').trim();
	
	// Guard against empty queries
	if (!q) {
		logSafe('geocodeAddress: Empty address provided');
		return { 
			ok: false, 
			status: 'EMPTY_QUERY', 
			results: [], 
			raw: null, 
			errorMessage: 'No address provided' 
		};
	}

	try {
		const params: Record<string, string> = {
			address: q
		};

		// Add country/state components to restrict results
		const components: string[] = [];
		if (opts?.country) components.push(`country:${opts.country}`);
		if (opts?.state) components.push(`administrative_area:${opts.state}`);
		if (components.length) {
			params.components = components.join('|');
		}

		// Add bounds bias if we have a current location
		if (opts?.biasCenter) {
			const radius = opts.kmBias ?? 25; // Reduced default bias radius for more precise results
			params.bounds = boundsFromCenter(opts.biasCenter, radius);
			logSafe('geocodeAddress: Adding bounds bias', {
				center: opts.biasCenter,
				radius,
				bounds: params.bounds
			});
		}

		logSafe('geocodeAddress: Making biased API request', {
			address: q,
			components: params.components,
			hasBounds: !!params.bounds
		});

		const response = await google.get('', { params });
		const json = response.data;

		logSafe('geocodeAddress: API response', {
			status: json?.status,
			resultsCount: Array.isArray(json?.results) ? json.results.length : 0
		});

		// Handle array response (some endpoints return arrays)
		const isArrayTop = Array.isArray(json);
		
		if (isArrayTop) {
			const status = json.length > 0 ? 'OK' : 'ZERO_RESULTS';
			return {
				ok: status === 'OK',
				status,
				results: json,
				raw: json,
				errorMessage: json.length === 0 ? 'No results found' : undefined
			};
		}

		// Standard response format
		const status = json.status ?? 'UNKNOWN';
		const results = Array.isArray(json.results) ? json.results : [];

		return {
			ok: status === 'OK',
			status,
			results,
			raw: json,
			errorMessage: json.error_message
		};

	} catch (error: any) {
		logSafe('geocodeAddress: Network or parsing error', { 
			message: error?.message, 
			code: error?.code 
		});
		
		return {
			ok: false,
			status: 'NETWORK_ERROR',
			results: [],
			raw: null,
			errorMessage: error.message || 'Network error occurred'
		};
	}
}

export default google;
