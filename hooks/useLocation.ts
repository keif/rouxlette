import { useEffect, useState } from "react";
import Geocoder from "react-native-geocoding";
import * as Location from "expo-location";
import { GOOGLE_API_KEY } from '@env';
import GeocoderResponse = Geocoder.GeocoderResponse;

interface useLocationProps {

}

interface latLong {
  latitude: number;
  longitude: number;
}

export default () => {
  const [city, setCity] = useState<string>(``);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string>(``);
  const [locationResults, setLocationResults] = useState<GeocoderResponse | {}>({});

  Geocoder.init(GOOGLE_API_KEY, {
    language: "en",
  });

  const handleError = (err: string) => {
    console.warn(`Location Error:`, err);
    setLocationErrorMessage(`We're having trouble finding you...`);
  };

  const getCity = async ({ latitude, longitude }: latLong) => {
    try {
      const response: GeocoderResponse = await Geocoder.from(`${latitude}, ${longitude}`);
      const locality = response.results[0].address_components.filter(component => component.types[0] === `locality`);
      const city: string = locality[0].long_name;
      setLocationResults(response.results);
      setCity(city);
    } catch (err) {
      handleError(err);
    }
  };

  const searchLocation = async (searchLocation: string) => {
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

  return [locationErrorMessage, city, locationResults, searchLocation] as const;
}
