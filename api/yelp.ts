import axios from "axios";
import { YELP_API_KEY } from "@env";

const YELP_URL = `https://api.yelp.com/v3/businesses`;

const yelp = axios.create({
	baseURL: YELP_URL,
	headers: {
		Authorization: `Bearer ${YELP_API_KEY}`,
	},
});

yelp.interceptors.request.use(function (config) {
	console.log(`pre yelp call`)
	return config;
}, function (error) {
	return Promise.reject(error);
});

export default yelp;
