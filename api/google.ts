import axios from "axios";
import { GOOGLE_API_KEY } from "@env";

const GOOGLE_MAP_URL: string = `https://maps.googleapis.com/maps/api/geocode/json`;

const google = axios.create({
	baseURL: GOOGLE_MAP_URL,
	headers: {
		Authorization: `Bearer ${GOOGLE_API_KEY}`,
	},
});

google.interceptors.request.use(function (config) {
	return config;
}, function (error) {
	return Promise.reject(error);
});

export default google;
