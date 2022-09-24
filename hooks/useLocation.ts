import { useEffect, useState } from "react";
import Geocoder from "react-native-geocoding";
import * as Location from "expo-location";
import { GOOGLE_API_KEY } from '@env';

export default () => {
  const [city, setCity] = useState(``);
  const [locationErrorMessage, setLocationErrorMessage] = useState(``);
  const [locationResults, setLocationResults] = useState({});

  Geocoder.init(GOOGLE_API_KEY, {
    language: "en",
  });

  const handleError = err => {
    console.warn(err);
    setLocationErrorMessage(`We're having trouble finding you...`);
  };

  const getCity = async ({ latitude, longitude }) => {
    Geocoder.from(`${latitude}, ${longitude}`)
      .then(json => {
        const locality = json.results[0].address_components.filter(component => component.types[0] === `locality`);
        const city = locality[0].long_name;
        setCity(city);
      })
      .catch(handleError);
  };

  const searchLocation = async (searchLocation) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationErrorMessage("Permission to access location was denied");
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
      );
      await getCity(location.coords);
    } catch (err) {
      handleError(err);
    }
  };

  useEffect(() => {
    searchLocation(``);
  }, []);

  return [locationErrorMessage, city, locationResults, searchLocation];
}
