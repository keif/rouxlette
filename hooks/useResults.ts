import { useEffect, useState } from "react";
import yelp from "../api/yelp";

export default () => {
  const [errorMessage, setErrorMessage] = useState(``);
  const [results, setResults] = useState([]);

  const searchApi = async (searchTerm, location = `columbus`) => {
    console.log(`searchApi: :: searchTerm: ${searchTerm} :: location: ${location}`)
    try {
      const response = await yelp.get(`/search`, {
        params: {
          limit: 50,
          location: location,
          term: searchTerm,
        },
      });

      setResults(response.data.businesses);
    } catch (err) {
      console.warn(`Results Error:`, err);
      setErrorMessage(`There was an error, please try again`);
      setTimeout(() => setErrorMessage(``), 3000);
    }
  };

  // Call searchApi when component is first rendered
  useEffect(() => {
    searchApi(``);
    setErrorMessage(``);
  }, []);

  return [errorMessage, results, searchApi];
}
