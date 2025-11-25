import axios from "axios";
import { YELP_API_KEY, DEV_USE_MOCK } from "@env";
import { logSafe } from "../utils/log";

// Mock data for development - avoids 429 rate limit errors
import mockSearchResponse from "../fixtures/yelpSearchResponse.json";

const YELP_URL = `https://api.yelp.com/v3`;

// Check if mock mode is enabled (only in dev)
const useMockData = __DEV__ && DEV_USE_MOCK === 'true';

if (useMockData) {
	logSafe('YELP MOCK MODE', { enabled: true, message: 'No real API calls will be made' });
}

const yelp = axios.create({
	baseURL: YELP_URL,
	headers: {
		Authorization: `Bearer ${YELP_API_KEY}`,
	},
});

yelp.interceptors.request.use(function (config) {
	logSafe('YELP REQUEST', {
		method: config.method?.toUpperCase(),
		url: config.url,
		params: config.params ? Object.keys(config.params) : [],
		hasAuth: !!config.headers?.Authorization,
		mockMode: useMockData
	});
	return config;
}, function (error) {
	logSafe('YELP REQUEST ERROR', { message: error?.message });
	return Promise.reject(error);
});

yelp.interceptors.response.use(function (response) {
	logSafe('YELP RESPONSE', {
		status: response.status,
		url: response.config?.url,
		businessCount: response.data?.businesses?.length || 0,
		totalResults: response.data?.total || 0
	});
	return response;
}, function (error) {
	logSafe('YELP RESPONSE ERROR', {
		status: error?.response?.status,
		message: error?.message,
		url: error?.config?.url
	});
	return Promise.reject(error);
});

// Mock adapter for development - intercepts requests and returns fixture data
if (useMockData) {
	yelp.interceptors.request.use(async function (config) {
		// Create a mock response that short-circuits the actual request
		const mockResponse = {
			data: getMockDataForRequest(config.url || ''),
			status: 200,
			statusText: 'OK',
			headers: {},
			config,
		};

		// Throw a "cancel" with our mock response attached
		// This prevents the actual HTTP request from being made
		return Promise.reject({
			__MOCK__: true,
			response: mockResponse,
		});
	});

	// Intercept the "error" and return the mock response instead
	yelp.interceptors.response.use(
		(response) => response,
		(error) => {
			if (error.__MOCK__) {
				logSafe('YELP MOCK RESPONSE', {
					url: error.response.config?.url,
					businessCount: error.response.data?.businesses?.length || 0,
				});
				return Promise.resolve(error.response);
			}
			return Promise.reject(error);
		}
	);
}

/**
 * Returns mock data based on the request URL
 */
function getMockDataForRequest(url: string): any {
	if (url.includes('/businesses/search')) {
		return mockSearchResponse;
	}

	// For business details, return the first mock business
	if (url.includes('/businesses/')) {
		const businessId = url.split('/businesses/')[1]?.split('?')[0];
		const business = mockSearchResponse.businesses.find(b => b.id === businessId);
		return business || mockSearchResponse.businesses[0];
	}

	return mockSearchResponse;
}

/**
 * Get detailed business information including hours, photos, and phone
 * @param id - The Yelp business ID
 * @returns Promise<YelpBusiness> - Full business details
 */
export async function getBusinessDetails(id: string) {
  const response = await yelp.get(`/businesses/${id}`);
  return response.data;
}

export default yelp;
