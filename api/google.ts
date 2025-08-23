import axios from "axios";
import { GOOGLE_API_KEY } from "@env";

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
		console.error('GOOGLE_API_KEY not found in environment variables');
	}
	
	console.log('Google API request:', {
		url: config.url,
		params: config.params,
		baseURL: config.baseURL
	});
	
	return config;
}, function (error) {
	console.error('Google API request error:', error);
	return Promise.reject(error);
});

google.interceptors.response.use(function (response) {
	console.log('Google API response:', {
		status: response.status,
		data: response.data
	});
	return response;
}, function (error) {
	console.error('Google API response error:', {
		message: error.message,
		response: error.response?.data,
		status: error.response?.status
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
		console.log('geocode: Empty query provided, returning EMPTY_QUERY status');
		return { 
			ok: false, 
			status: 'EMPTY_QUERY', 
			results: [], 
			raw: null, 
			errorMessage: 'No query provided' 
		};
	}

	try {
		console.log('geocode: Making API request for query:', q);
		const response = await google.get('', {
			params: { address: q }
		});

		const json = response.data;
		console.log('geocode: Raw API response:', json);

		// Handle case where API returns an array at top level (some Google APIs do this)
		const isArrayTop = Array.isArray(json);
		
		if (isArrayTop) {
			console.log('geocode: Detected array-level response, normalizing...');
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

		console.log('geocode: Normalized response:', { status, resultsCount: results.length, errorMessage });

		return {
			ok: status === 'OK',
			status,
			results,
			raw: json,
			errorMessage
		};

	} catch (error: any) {
		console.error('geocode: Network or parsing error:', error);
		
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
	console.log('reverseGeocode: Converting coordinates to address:', latlng);
	
	try {
		const response = await google.get('', {
			params: { latlng }
		});

		const json = response.data;
		console.log('reverseGeocode: Raw API response:', json);

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
		console.error('reverseGeocode: Error:', error);
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

export default google;
