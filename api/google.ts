import axios from "axios";
import { GOOGLE_API_KEY } from '@env';

const GOOGLE_MAP_URL: string = `https://maps.googleapis.com/maps/api/geocode/json`

export default axios.create({
    baseURL: GOOGLE_MAP_URL,
    headers: {
        Authorization: `Bearer ${GOOGLE_API_KEY}`
    }
})
