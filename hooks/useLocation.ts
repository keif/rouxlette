import { useContext, useEffect, useState, useRef } from "react";
import Geocoder from "react-native-geocoding";
import * as Location from "expo-location";
import { LocationObjectCoords } from "expo-location";
import { GOOGLE_API_KEY } from "@env";
import usePersistentStorage from "./usePersistentStorage";
import { RootContext } from "../context/RootContext";
import { setLocation, setCoords } from "../context/reducer";
import { GeocodeResponse, geocodeAddress, reverseGeocode, humanizeGeocodeError } from "../api/google";
import { logSafe, logNetwork } from "../utils/log";
import { Coords, haversineKm, findClosestResult, extractCanonicalLabel, extractStateFromResult, extractCoordsFromResult } from "./geoUtils";
import GeocoderResponse = Geocoder.GeocoderResponse;

interface LocationResult {
	city: string;
	results: any[];
}

// Enhanced interface for resolved location data
export interface ResolvedLocation {
	coords: Coords | null;        // Resolved coordinates
	label: string;                // Canonical label like "Powell, OH"
	state?: string;               // State code like "OH"
	source: 'coords' | 'geocoded' | 'fallback'; // How the location was resolved
	alternatives?: Array<{        // Alternative location matches (if disambiguation occurred)
		label: string;
		coords: Coords;
		distance?: number;        // Distance from user in km
	}>;
}

interface LocationState {
	place: string | null;
	coords: LocationObjectCoords | null;
}

interface UseLocationReturn {
	locationErrorMessage: string;
	city: string;
	coords: LocationObjectCoords | null;
	locationResults: any[];
	searchLocation: (query: string | null | undefined) => Promise<LocationResult | null>;
	resolveSearchArea: (query: string | null | undefined) => Promise<ResolvedLocation | null>;
	isLoading: boolean;
}

export default (): [string, string, string, LocationObjectCoords | null, any[], (query: string | null | undefined) => Promise<LocationResult | null>, (query: string | null | undefined) => Promise<ResolvedLocation | null>, boolean, ResolvedLocation | null] => {
	const [city, setCity] = useState<string>(``);
	const [canonicalLocation, setCanonicalLocation] = useState<string>(``); // For display like "Powell, OH"
	const [locationErrorMessage, setLocationErrorMessage] = useState<string>(``);
	const [locationResults, setLocationResults] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [lastResolvedLocation, setLastResolvedLocation] = useState<ResolvedLocation | null>(null);
	const storage = usePersistentStorage({
		debug: __DEV__,
		debounceMs: 800, // Longer delay for location data
		keyPrefix: '@roux:location'
	});
	const { dispatch, state } = useContext(RootContext);
	const currentCoords = state.currentCoords; // Read from global context
	const locationWatcher = useRef<Location.LocationSubscription | null>(null);

	// Dev logging helper
	const devLog = (message: string, ...args: any[]) => {
		if (__DEV__) {
			logSafe(`[useLocation] ${message}`, ...args);
		}
	};

	Geocoder.init(GOOGLE_API_KEY, {
		language: "en",
	});

	const handleError = (err: string, details?: string) => {
		devLog(`Location Error:`, err, details ? `Details: ${details}` : '');
		setLocationErrorMessage(err);
		setTimeout(() => setLocationErrorMessage(``), 3000);
	};

	const clearLocationState = () => {
		devLog('Clearing location state');
		setCity('');
		setCanonicalLocation('');
		setLocationResults([]);
		setLocationErrorMessage('');
		dispatch(setCoords(null));
		dispatch(setLocation(''));
	};

	// Normalize coordinates to avoid cache thrashing
	const normalizeCoords = (coords: LocationObjectCoords) => {
		return {
			lat: Math.round(coords.latitude * 10000) / 10000, // 4 decimal precision ~11m accuracy
			lng: Math.round(coords.longitude * 10000) / 10000,
		};
	};

	const setLocationFromCoords = async (coords: LocationObjectCoords): Promise<LocationResult | null> => {
		try {
			devLog('Setting location from coordinates:', coords);
			dispatch(setCoords(coords));
			setIsLoading(true);

			const response = await reverseGeocode(coords.latitude, coords.longitude);

			if (!response.ok || !response.results?.length) {
				logSafe('Failed to reverse geocode coordinates', { status: response.status });
				handleError(humanizeGeocodeError(response));
				return null;
			}

			const result = extractCityFromResult(response.results[0]);
			const canonical = extractCanonicalLabel(response.results[0]);
			const locationResult = {
				city: result,
				results: response.results
			};

			setCity(result);
			setCanonicalLocation(canonical);
			setLocationResults(response.results);
			dispatch(setLocation(result));

			devLog('Successfully set location to:', canonical, 'coords:', normalizeCoords(coords));
			return locationResult;

		} catch (error: any) {
			logSafe('Error setting location from coordinates', { message: error?.message });
			handleError('Error getting location from coordinates');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	// Start location watching for live updates
	const startLocationWatcher = async (): Promise<boolean> => {
		try {
			devLog('Starting location watcher');
			
			// Clean up existing watcher
			if (locationWatcher.current) {
				locationWatcher.current.remove();
				locationWatcher.current = null;
			}

			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				devLog('Location permission denied');
				handleError('Location permission denied');
				return false;
			}

			// Start watching location changes
			locationWatcher.current = await Location.watchPositionAsync(
				{
					accuracy: Location.Accuracy.Balanced,
					timeInterval: 5000, // Update every 5 seconds
					distanceInterval: 50, // Update when moved 50 meters
				},
				(location) => {
					devLog('Location updated via watcher:', location.coords);
					setLocationFromCoords(location.coords);
				}
			);

			devLog('Location watcher started successfully');
			return true;
		} catch (error) {
			devLog('Failed to start location watcher:', error);
			handleError('Failed to start location monitoring');
			return false;
		}
	};

	// Stop location watching
	const stopLocationWatcher = () => {
		if (locationWatcher.current) {
			devLog('Stopping location watcher');
			locationWatcher.current.remove();
			locationWatcher.current = null;
		}
	};

	// Legacy function kept for backward compatibility with old response format
	const validateGeocodingResponse = (response: any): LocationResult | null => {
		// Handle new normalized GeocodeResponse format
		if (response && typeof response === 'object' && 'ok' in response) {
			const geocodeResp = response as GeocodeResponse;
			if (!geocodeResp.ok || !geocodeResp.results?.length) {
				logSafe('Geocoding validation failed', { status: geocodeResp.status, hasResults: !!geocodeResp.results?.length });
				handleError(humanizeGeocodeError(geocodeResp));
				return null;
			}

			const firstResult = geocodeResp.results[0];
			if (!firstResult?.address_components || !Array.isArray(firstResult.address_components)) {
				logSafe('Invalid result structure - missing address_components', { hasResult: !!firstResult, hasComponents: !!firstResult?.address_components });
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
			logSafe('Invalid response structure', { responseType: typeof response });
			return null;
		}

		// Check response status
		if (response.status !== 'OK') {
			logSafe('Legacy geocoding response error', { status: response.status });
			handleError('Location service error');
			return null;
		}

		// Check if results array exists and has content
		if (!response.results || !Array.isArray(response.results) || response.results.length === 0) {
			logSafe('No results in legacy response', { hasResults: !!response.results, isArray: Array.isArray(response.results) });
			handleError('No location results found');
			return null;
		}

		// Validate first result has required structure
		const firstResult = response.results[0];
		if (!firstResult?.address_components || !Array.isArray(firstResult.address_components)) {
			logSafe('Invalid result structure - missing address_components', { hasResult: !!firstResult, hasComponents: !!firstResult?.address_components });
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
		} catch (error: any) {
			logSafe('Error extracting city from result', { message: error?.message, hasResult: !!result });
			return 'Unknown Location';
		}
	};

	const getCity = async (searchLocation: string, latLong: LocationObjectCoords): Promise<LocationResult | null> => {
		let key = `${searchLocation}`;
		const { latitude, longitude } = latLong;

		try {
			devLog(`Geocoding coordinates: ${latitude}, ${longitude}`);
			const response: GeocoderResponse = await Geocoder.from(`${latitude}, ${longitude}`);
			
			// Validate the response before processing
			const validatedResult = validateGeocodingResponse(response);
			
			if (!validatedResult) {
				logSafe('Geocoding validation failed');
				return null;
			}

			const { city, results } = validatedResult;
			
			setLocationResults(results);
			setCity(city);
			key = (key.trim() !== ``) ? key : city;
			
			// Cache the results
			await storage.setItem(key, results);
			dispatch(setLocation(city));
			
			devLog(`Successfully geocoded to city: ${city}`);
			return validatedResult;

		} catch (err: unknown) {
			logSafe(`getCity: error`, { message: err instanceof Error ? err.message : String(err) });
			
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
			
			logSafe('Unable to extract city from response', { responseType: typeof response, isArray: Array.isArray(response) });
			return 'Unknown Location';
		} catch (error: any) {
			logSafe('Error in getResponseCity', { message: error?.message });
			return 'Unknown Location';
		}
	};

	const searchLocation = async (query: string | null | undefined): Promise<LocationResult | null> => {
		const q = (query ?? '').trim();
		
		devLog('searchLocation called with query:', q);
		setIsLoading(true);
		
		try {
			// GUARD: Handle empty query - use current location or start watcher
			if (!q) {
				devLog('Empty query - getting current location');
				
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					devLog('No location permissions');
					handleError('Location permission required');
					clearLocationState();
					return null;
				}

				// Get current position
				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Balanced,
					timeInterval: 5000,
					distanceInterval: 100,
				});

				devLog('Got current position:', location.coords);
				
				// Start location watcher for live updates
				await startLocationWatcher();
				
				return setLocationFromCoords(location.coords);
			}

			// For non-empty queries, proceed with normal flow
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				const errorMsg = "Permission to access location was denied";
				handleError(errorMsg);
				devLog(errorMsg);
				return null;
			}

			// Check cache first for the specific query
			const cache = await storage.getItem(q);

			if (cache) {
				devLog('Using cached location data for:', q);
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
				} catch (parseError: any) {
					logSafe('Error parsing cached location data', { message: parseError?.message });
					// Continue to get fresh location data
				}
			}

			// Get fresh location data
			devLog('Getting current position for query:', q);
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
				timeInterval: 1000,
				distanceInterval: 1,
			});

			// Store coordinates for future use
			dispatch(setCoords(location.coords));
			
			const result = await getCity(q, location.coords);
			return result;

		} catch (err: unknown) {
			logSafe(`searchLocation: error`, { message: err instanceof Error ? err.message : String(err) });
			
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
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Enhanced location resolver that geocodes city names to coordinates
	 * This is the key function for disambiguating location strings like "powell"
	 * 
	 * @param query - Location query (city name, address, etc)
	 * @returns ResolvedLocation with coordinates and canonical label
	 */
	const resolveSearchArea = async (query: string | null | undefined): Promise<ResolvedLocation | null> => {
		const q = (query ?? '').trim();
		
		devLog('resolveSearchArea called with:', q);
		
		try {
			// CASE 1: Empty query - use current device coordinates
			if (!q) {
				if (currentCoords) {
					devLog('Using existing current coordinates');
					// Try to get a canonical label for current coordinates
					const response = await reverseGeocode(currentCoords.latitude, currentCoords.longitude);
					if (response.ok && response.results?.length) {
						const label = extractCanonicalLabel(response.results[0]);
						// Update UI state with canonical location
						setCanonicalLocation(label);
						return {
							coords: { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
							label,
							source: 'coords'
						};
					}
				}
				
				// Get fresh current location
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					devLog('No location permissions for empty query');
					return null;
				}
				
				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Balanced,
				});
				
				dispatch(setCoords(location.coords));
				
				const response = await reverseGeocode(location.coords.latitude, location.coords.longitude);
				if (response.ok && response.results?.length) {
					const label = extractCanonicalLabel(response.results[0]);
					// Update UI state with canonical location
					setCanonicalLocation(label);
					return {
						coords: { latitude: location.coords.latitude, longitude: location.coords.longitude },
						label,
						source: 'coords'
					};
				}
				
				return {
					coords: { latitude: location.coords.latitude, longitude: location.coords.longitude },
					label: 'Current Location',
					source: 'coords'
				};
			}
			
			// CASE 2: Query provided - geocode with bias
			
			// Determine current state for bias (if we have coordinates)
			let currentState: string | null = null;

			devLog('Building geocode options - currentCoords:', currentCoords ? `${currentCoords.latitude}, ${currentCoords.longitude}` : 'null');

			if (currentCoords) {
				const reverseResponse = await reverseGeocode(currentCoords.latitude, currentCoords.longitude);
				if (reverseResponse.ok && reverseResponse.results?.length) {
					currentState = extractStateFromResult(reverseResponse.results[0]);
					devLog('Extracted state from coords:', currentState);
				}
			} else {
				devLog('WARNING: No currentCoords available for bias!');
			}

			// Build geocoding options with bias
			const geocodeOpts: Parameters<typeof geocodeAddress>[1] = {
				country: 'US', // Always restrict to US
			};

			if (currentState) {
				geocodeOpts.state = currentState;
				devLog('Adding state bias:', currentState);
			}

			if (currentCoords) {
				geocodeOpts.biasCenter = { latitude: currentCoords.latitude, longitude: currentCoords.longitude };
				geocodeOpts.kmBias = 25; // Reduced from 50km to 25km for stronger bias toward nearby locations
				devLog('Adding location bias:', geocodeOpts.biasCenter, `radius: ${geocodeOpts.kmBias}km`);
			}
			
			// Geocode the query with bias
			devLog('Geocoding query with bias:', { query: q, opts: geocodeOpts });
			const response = await geocodeAddress(q, geocodeOpts);
			
			if (!response.ok || !response.results?.length) {
				devLog('Geocoding failed or no results');
				// Show user-friendly message about using text search
				if (response.status === 'ZERO_RESULTS') {
					handleError("Couldn't pinpoint that location—using text search (results may be broader).");
				} else {
					handleError("Location service error—using text search instead.");
				}
				
				// Fallback: return the query as a string location
				return {
					coords: null,
					label: q,
					source: 'fallback'
				};
			}
			
			// Choose the best result
			let bestResult = response.results[0]; // Default to first result
			let locationAlternatives: ResolvedLocation['alternatives'] = undefined;

			// If we have current coordinates, find the closest result
			if (currentCoords && response.results.length > 1) {
				const currentCoordsForDistance = { latitude: currentCoords.latitude, longitude: currentCoords.longitude };
				const closest = findClosestResult(response.results, currentCoordsForDistance);

				if (closest) {
					bestResult = closest;
					devLog('Selected closest result by distance');

					// Build alternatives array for disambiguation UI
					if (response.results.length >= 2) {
						locationAlternatives = response.results.slice(0, 5).map(r => {
							const altCoords = extractCoordsFromResult(r);
							const altLabel = extractCanonicalLabel(r);
							const distance = altCoords ? haversineKm(currentCoordsForDistance, altCoords) : undefined;
							return {
								label: altLabel,
								coords: altCoords!,
								distance
							};
						}).filter(alt => alt.coords); // Filter out any with invalid coords

						devLog('Disambiguation occurred - alternatives:', locationAlternatives.map(a => `${a.label} (${a.distance?.toFixed(0)}km)`));
					}
				}
			}

			// Extract data from the best result
			const coords = extractCoordsFromResult(bestResult);
			const label = extractCanonicalLabel(bestResult);
			const state = extractStateFromResult(bestResult);

			devLog('Resolved location:', { coords, label, state, hasAlternatives: !!locationAlternatives });

			// Update UI state with canonical location
			setCanonicalLocation(label);

			const resolvedLoc: ResolvedLocation = {
				coords,
				label,
				state,
				source: 'geocoded',
				alternatives: locationAlternatives
			};

			// Store for UI components to access
			setLastResolvedLocation(resolvedLoc);

			return resolvedLoc;
			
		} catch (error: any) {
			logSafe('resolveSearchArea error', { message: error?.message, query: q });
			
			// Fallback: return the query as a string location
			return {
				coords: null,
				label: q || 'Unknown Location',
				source: 'fallback'
			};
		}
	};

	// Cleanup watcher on unmount
	useEffect(() => {
		return () => {
			stopLocationWatcher();
		};
	}, []);

	// Initialize location on mount (disabled to prevent multiple instances from auto-starting)
	// Components should manually call searchLocation('') when they need location
	// useEffect(() => {
	//   devLog('useLocation initializing');
	//   searchLocation(``).catch((error: any) => {
	//     logSafe('Initial location search failed', { message: error?.message });
	//     handleError('Failed to get initial location', String(error));
	//   });
	// }, []);

	return [locationErrorMessage, city, canonicalLocation, currentCoords, locationResults, searchLocation, resolveSearchArea, isLoading, lastResolvedLocation] as const;
}