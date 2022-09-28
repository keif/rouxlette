import axios from "axios";
import { GOOGLE_API_KEY } from '@env';
import yelp from "./yelp";

const GOOGLE_MAP_URL: string = `https://maps.googleapis.com/maps/api/geocode/json`

const google = axios.create({
    baseURL: GOOGLE_MAP_URL,
    headers: {
        Authorization: `Bearer ${GOOGLE_API_KEY}`
    }
})

google.interceptors.request.use(function (config) {
    console.log(`pre google call`)
    return config;
}, function (error) {
    return Promise.reject(error);
});

export default google
