import { useContext, useEffect, useState } from "react";
import Geocoder from "react-native-geocoding";
import * as Location from "expo-location";
import { LocationObjectCoords } from "expo-location";
import { GOOGLE_API_KEY } from "@env";
import useStorage from "./useStorage";
import { RootContext } from "../context/RootContext";
import { setLocation } from "../context/reducer";
import { GeocodeResponse, reverseGeocode, humanizeGeocodeError } from "../api/google";
import GeocoderResponse = Geocoder.GeocoderResponse;

interface LocationResult {
	city: string;
	results: any[];
}

interface LocationState {
	place: string | null;
	coords: LocationObjectCoords | null;
}

export default () => {
	const [city, setCity] = useState<string>(``);
	const [locationErrorMessage, setLocationErrorMessage] = useState<string>(``);
	const [locationResults, setLocationResults] = useState<any[]>([]);
	const [lastKnownCoords, setLastKnownCoords] = useState<LocationObjectCoords | null>(null);
	const [deleteItem, getAllItems, getItem, setItem] = useStorage();
	const { dispatch } = useContext(RootContext);

	Geocoder.init(GOOGLE_API_KEY, {
		language: "en",
	});

	const handleError = (err: string, details?: string) => {
		console.warn(`Location Error:`, err, details ? `Details: ${details}` : '');
		setLocationErrorMessage(err);
		setTimeout(() => setLocationErrorMessage(``), 3000);
	};

	const clearLocationState = () => {
		console.log('clearLocationState: Resetting location to unset state');
		setCity('');
		setLocationResults([]);
		setLocationErrorMessage('');
		dispatch(setLocation(''));
	};

	const setLocationFromCoords = async (coords: LocationObjectCoords): Promise<LocationResult | null> => {
		try {
			console.log('setLocationFromCoords: Using coordinates:', coords);
			setLastKnownCoords(coords);
			
			const response = await reverseGeocode(coords.latitude, coords.longitude);
			
			if (!response.ok || !response.results?.length) {
				console.error('setLocationFromCoords: Failed to reverse geocode coordinates');
				handleError(humanizeGeocodeError(response));
				return null;
			}

			const result = extractCityFromResult(response.results[0]);
			const locationResult = {
				city: result,
				results: response.results
			};

			setCity(result);
			setLocationResults(response.results);
			dispatch(setLocation(result));
			
			console.log('setLocationFromCoords: Successfully set location to:', result);
			return locationResult;

		} catch (error) {
			console.error('setLocationFromCoords: Error:', error);
			handleError('Error getting location from coordinates');
			return null;
		}
	};

	// Legacy function kept for backward compatibility with old response format
	const validateGeocodingResponse = (response: any): LocationResult | null => {
		// Handle new normalized GeocodeResponse format
		if (response && typeof response === 'object' && 'ok' in response) {
			const geocodeResp = response as GeocodeResponse;
			if (!geocodeResp.ok || !geocodeResp.results?.length) {
				console.error('Geocoding validation failed:', geocodeResp);
				handleError(humanizeGeocodeError(geocodeResp));
				return null;
			}

			const firstResult = geocodeResp.results[0];
			if (!firstResult?.address_components || !Array.isArray(firstResult.address_components)) {
				console.error('Invalid result structure - missing address_components:', firstResult);
				handleError('Invalid location data received');
				return null;
			}

			return {
				city: extractCityFromResult(firstResult),
				results: geocodeResp.results
			};
		}

		// Handle legacy response format (for cached data compatibility)
		if (!response || typeof response !== 'object') {
			console.error('Invalid response structure:', response);
			return null;
		}

		// Check response status
		if (response.status !== 'OK') {
			console.error('Legacy geocoding response error:', response);
			handleError('Location service error');
			return null;
		}

		// Check if results array exists and has content
		if (!response.results || !Array.isArray(response.results) || response.results.length === 0) {
			console.error('No results in legacy response:', response);
			handleError('No location results found');
			return null;
		}

		// Validate first result has required structure
		const firstResult = response.results[0];
		if (!firstResult?.address_components || !Array.isArray(firstResult.address_components)) {
			console.error('Invalid result structure - missing address_components:', firstResult);
			handleError('Invalid location data received');
			return null;
		}

		return {
			city: extractCityFromResult(firstResult),
			results: response.results
		};
	};

	const extractCityFromResult = (result: any): string => {
		try {
			const locality = result.address_components?.filter((component: any) => 
				component.types?.includes('locality')
			);

			if (locality && locality.length > 0 && locality[0].long_name) {
				return locality[0].long_name;
			}

			// Fallback to administrative_area_level_2 or administrative_area_level_1
			const adminArea2 = result.address_components?.filter((component: any) => 
				component.types?.includes('administrative_area_level_2')
			);
			
			if (adminArea2 && adminArea2.length > 0 && adminArea2[0].long_name) {
				return adminArea2[0].long_name;
			}

			const adminArea1 = result.address_components?.filter((component: any) => 
				component.types?.includes('administrative_area_level_1')
			);
			
			if (adminArea1 && adminArea1.length > 0 && adminArea1[0].long_name) {
				return adminArea1[0].long_name;
			}

			// Last resort - use formatted_address
			return result.formatted_address || 'Unknown Location';
		} catch (error) {
			console.error('Error extracting city from result:', error, result);
			return 'Unknown Location';
		}
	};

	const getCity = async (searchLocation: string, latLong: LocationObjectCoords): Promise<LocationResult | null> => {
		let key = `${searchLocation}`;
		const { latitude, longitude } = latLong;

		try {
			console.log(`Geocoding coordinates: ${latitude}, ${longitude}`);
			const response: GeocoderResponse = await Geocoder.from(`${latitude}, ${longitude}`);
			
			// Validate the response before processing
			const validatedResult = validateGeocodingResponse(response);
			
			if (!validatedResult) {
				console.error('Geocoding validation failed');
				return null;
			}

			const { city, results } = validatedResult;
			
			setLocationResults(results);
			setCity(city);
			key = (key.trim() !== ``) ? key : city;
			
			// Cache the results
			await setItem(key, JSON.stringify(results));
			dispatch(setLocation(city));
			
			console.log(`Successfully geocoded to city: ${city}`);
			return validatedResult;

		} catch (err: unknown) {
			console.error(`getCity: error:`, err);
			
			// Handle network errors or other exceptions
			if (err instanceof Error) {
				handleError('Network error while getting location', err.message);
			} else {
				handleError('Unknown error while getting location', String(err));
			}
			return null;
		}
	};

	// Legacy function - kept for cache compatibility but now uses safe extraction
	const getResponseCity = (response: GeocoderResponse | any): string => {
		try {
			// Use the new safe validation approach
			const validatedResult = validateGeocodingResponse(response);
			if (validatedResult) {
				return validatedResult.city;
			}
			
			// Fallback for cached data that might not have full response structure
			if (response && Array.isArray(response) && response.length > 0) {
				return extractCityFromResult(response[0]);
			}
			
			console.warn('Unable to extract city from response:', response);
			return 'Unknown Location';
		} catch (error) {
			console.error('Error in getResponseCity:', error);
			return 'Unknown Location';
		}
	};

	const searchLocation = async (query: string | null | undefined): Promise<LocationResult | null> => {
		const q = (query ?? '').trim();
		
		// GUARD: Handle empty query - reset to device location or unset state
		if (!q) {
			console.log('searchLocation: Empty query detected, resetting location state');
			
			// If we have last known coordinates, use them
			if (lastKnownCoords) {
				console.log('searchLocation: Using last known coordinates');
				return setLocationFromCoords(lastKnownCoords);
			}

			// Otherwise try to get current location if permissions allow
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status === "granted") {
					console.log('searchLocation: Getting current position for empty query');
					const location = await Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Balanced,
						timeInterval: 5000,
						distanceInterval: 100,
					});
					return setLocationFromCoords(location.coords);
				} else {
					console.log('searchLocation: No permissions, clearing location state');
					clearLocationState();
					return null;
				}
			} catch (error) {
				console.log('searchLocation: Could not get current location, clearing state');
				clearLocationState();
				return null;
			}
		}

		// For non-empty queries, proceed with normal flow
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			const errorMsg = "Permission to access location was denied";
			handleError(errorMsg);
			console.warn(errorMsg);
			return null;
		}

		try {
			// Check cache first for the specific query
			const cache = await getItem(q);

			if (cache) {
				console.log('searchLocation: Using cached location data for:', q);
				try {
					const parsedCache = typeof cache === 'string' ? JSON.parse(cache) : cache;
					const city = getResponseCity(parsedCache);
					setCity(city);
					setLocationResults(Array.isArray(parsedCache) ? parsedCache : []);
					dispatch(setLocation(city));
					
					return {
						city,
						results: Array.isArray(parsedCache) ? parsedCache : []
					};
				} catch (parseError) {
					console.warn('Error parsing cached location data:', parseError);
					// Continue to get fresh location data
				}
			}

			// Get fresh location data
			console.log('searchLocation: Getting current position for query:', q);
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
				timeInterval: 1000,
				distanceInterval: 1,
			});

			// Store coordinates for future use
			setLastKnownCoords(location.coords);
			
			const result = await getCity(q, location.coords);
			return result;

		} catch (err: unknown) {
			console.error(`searchLocation: error:`, err);
			
			// Provide more specific error handling
			if (err instanceof Error) {
				if (err.message.includes('Location request timed out')) {
					handleError('Location request timed out. Please try again.');
				} else if (err.message.includes('Location services are disabled')) {
					handleError('Location services are disabled. Please enable them in settings.');
				} else {
					handleError('Error getting your location');
				}
			} else {
				handleError('Unknown error while searching location');
			}
			return null;
		}
	};

	useEffect(() => {
		searchLocation(``).catch((error) => {
			console.error('Initial location search failed:', error);
			handleError('Failed to get initial location', String(error));
		});
	}, []);

	return [locationErrorMessage, city, locationResults, searchLocation] as const;
}
