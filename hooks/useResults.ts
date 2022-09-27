import { useEffect, useState } from "react";
import yelp from "../api/yelp";
import { AxiosResponse } from "axios";

export interface Result {
  alias:         string;
  categories:    Category[];
  coordinates:   Coordinates;
  display_phone: string;
  distance:      number;
  id:            string;
  image_url:     string;
  is_closed:     boolean;
  location:      Location;
  name:          string;
  phone:         string;
  price:         string;
  rating:        number;
  review_count:  number;
  transactions:  string[];
  url:           string;
}

export interface Category {
  alias: string;
  title: string;
}

export interface Coordinates {
  latitude:  number;
  longitude: number;
}

export interface Location {
  address1:        string;
  address2:        null;
  address3:        string;
  city:            string;
  country:         string;
  display_address: string[];
  state:           string;
  zip_code:        string;
}

export default () => {
  const [errorMessage, setErrorMessage] = useState<string>(``);
  const [results, setResults] = useState<Array<Result> | []>([]);

  const searchApi = async (searchTerm: string, location = `columbus`) => {
    try {
      const response: AxiosResponse = await yelp.get(`/search`, {
        params: {
          limit: 50,
          location: location,
          term: searchTerm,
        },
      });

      setResults(response.data.businesses);
    } catch (err) {
      setErrorMessage(`There was an error, please try again`);
      setTimeout(() => setErrorMessage(``), 3000);
    }
  };

  // Call searchApi when component is first rendered
  useEffect(() => {
    searchApi(``);
    setErrorMessage(``);
  }, []);

  return [errorMessage, results, searchApi] as const;
}
