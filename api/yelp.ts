import axios from 'axios'
import { YELP_API_KEY } from '@env';

const YELP_URL = `https://api.yelp.com/v3/businesses`

export default axios.create({
  baseURL: YELP_URL,
  headers: {
    Authorization: `Bearer ${ YELP_API_KEY }`
  }
})
