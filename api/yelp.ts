import axios from "axios";
import { YELP_API_KEY } from "@env";
import { logSafe } from "../utils/log";

const YELP_URL = `https://api.yelp.com/v3`;

const yelp = axios.create({
	baseURL: YELP_URL,
	headers: {
		Authorization: `Bearer ${YELP_API_KEY}`,
	},
});

yelp.interceptors.request.use(function (config) {
	logSafe('YELP REQUEST', {
		method: config.method?.toUpperCase(),
		url: config.url, // Just the path, not full URL to avoid redundancy
		params: config.params ? Object.keys(config.params) : [],
		hasAuth: !!config.headers?.Authorization
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
