import axios from 'axios';

// Public Overpass endpoint. Configurable so it can be swapped or self-hosted.
// Overpass requires an identifying User-Agent/Referer.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const overpass = axios.create({
  baseURL: OVERPASS_URL,
  headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Rouxlette/1.0 (https://github.com/keif/rouxlette)' },
  timeout: 15000,
});

export default overpass;
