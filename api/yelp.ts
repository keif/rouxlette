import axios from "axios";
import { YELP_API_KEY } from "@env";

const YELP_URL = `https://api.yelp.com/v3`;

const yelp = axios.create({
	baseURL: YELP_URL,
	headers: {
		Authorization: `Bearer ${YELP_API_KEY}`,
	},
});

yelp.interceptors.request.use(function (config) {
	console.log('[YELP REQUEST]', {
		method: config.method?.toUpperCase(),
		url: `${config.baseURL}${config.url}`,
		params: config.params ? Object.keys(config.params) : [],
		hasAuth: !!config.headers?.Authorization
	});
	return config;
}, function (error) {
	console.log('[YELP REQUEST ERROR]', { message: error?.message });
	return Promise.reject(error);
});

yelp.interceptors.response.use(function (response) {
	console.log('[YELP RESPONSE]', {
		status: response.status,
		url: response.config?.url,
		businessCount: response.data?.businesses?.length || 0
	});
	return response;
}, function (error) {
	console.log('[YELP RESPONSE ERROR]', {
		status: error?.response?.status,
		message: error?.message,
		url: error?.config?.url
	});
	return Promise.reject(error);
});

export default yelp;
