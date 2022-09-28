import { useEffect, useState } from "react";
import Geocoder from "react-native-geocoding";
import * as Location from "expo-location";
import { GOOGLE_API_KEY } from "@env";
import GeocoderResponse = Geocoder.GeocoderResponse;
import useStorage from "./useStorage";
import { LocationObjectCoords } from "expo-location";

export default () => {
	const [city, setCity] = useState<string>(``);
	const [locationErrorMessage, setLocationErrorMessage] = useState<string>(``);
	const [locationResults, setLocationResults] = useState<GeocoderResponse | {}>({});
	const [deleteItem, getAllItems, getItem, setItem] = useStorage();

	Geocoder.init(GOOGLE_API_KEY, {
		language: "en",
	});

	const handleError = (err: string) => {
		console.warn(`Location Error:`, err);
		setLocationErrorMessage(`We're having trouble finding you...`);
	};

	const getCity = async (searchLocation: string, latLong: LocationObjectCoords) => {
		const key = `${searchLocation}`;
		const { latitude, longitude } = latLong;
		console.log(`getCity: ${latitude}, ${longitude}`);

		try {
			const response: GeocoderResponse = await Geocoder.from(`${latitude}, ${longitude}`);
			const locality = response.results[0].address_components.filter(component => component.types[0] === `locality`);
			const city: string = locality[0].long_name;
			console.log(`getCity: city: ${city}`);
			setLocationResults(response.results);
			await setItem(key, city);
			setCity(city);
		} catch (err) {
			console.error(`getCity: error:`, err);
			handleError(err);
		}
	};

	const searchLocation = async (searchLocation: string) => {
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			setLocationErrorMessage("Permission to access location was denied");
			return;
		}

		console.log(`searchLocation`);
		const key = `${searchLocation}`;
		try {
			const cache = await getItem(key)

			if (cache) {
				setCity(cache)
			} else {
				const location = await Location.getCurrentPositionAsync(
					{
						accuracy: Location.Accuracy.High,
						timeInterval: 1000,
						distanceInterval: 1,
					},
				);
				console.log(`searchLocation: try`);
				await getCity(searchLocation, location.coords);
			}
		} catch (err) {
			console.error(`searchLocation: error:`, err);
			handleError(err);
		}
	};

	useEffect(() => {
		console.log(`useLocation: useEffect`);
		searchLocation(``);
	}, []);

	return [locationErrorMessage, city, locationResults, searchLocation] as const;
}
