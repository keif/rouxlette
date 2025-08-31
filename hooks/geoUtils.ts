/**
 * Geographic utility functions for location calculations
 */

export type Coords = { latitude: number; longitude: number };

/**
 * Calculate the haversine distance between two coordinate points in kilometers
 * Uses the haversine formula for great-circle distance calculation
 * 
 * @param a - First coordinate point
 * @param b - Second coordinate point
 * @returns Distance in kilometers
 */
export function haversineKm(a: Coords, b: Coords): number {
	const R = 6371; // Earth's radius in kilometers
	
	const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
	const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
	
	const lat1 = (a.latitude * Math.PI) / 180;
	const lat2 = (b.latitude * Math.PI) / 180;
	
	const x = Math.sin(dLat / 2) ** 2 + 
		Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
	
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

/**
 * Find the closest result to a reference point by haversine distance
 * 
 * @param results - Array of geocoding results with geometry.location
 * @param referencePoint - Coordinate to compare distances to
 * @returns The closest result or null if no results
 */
export function findClosestResult(
	results: any[], 
	referencePoint: Coords
): any | null {
	if (!results?.length) return null;
	
	let closest: any = null;
	let minDistance = Infinity;
	
	for (const result of results) {
		const location = result?.geometry?.location;
		if (!location?.lat || !location?.lng) continue;
		
		const coords = { latitude: location.lat, longitude: location.lng };
		const distance = haversineKm(referencePoint, coords);
		
		if (distance < minDistance) {
			minDistance = distance;
			closest = result;
		}
	}
	
	return closest;
}

/**
 * Extract canonical location label from geocoding result
 * Returns format like "Powell, OH" or "Columbus, OH"
 * 
 * @param result - Geocoding result with address_components
 * @returns Canonical location string
 */
export function extractCanonicalLabel(result: any): string {
	try {
		const components = result?.address_components || [];
		
		// Find locality (city/town)
		const locality = components.find((c: any) => 
			c.types?.includes('locality')
		);
		
		// Find state (administrative_area_level_1)  
		const state = components.find((c: any) => 
			c.types?.includes('administrative_area_level_1')
		);
		
		if (locality && state) {
			return `${locality.long_name}, ${state.short_name}`;
		}
		
		// Fallback to administrative_area_level_2 (county) if no locality
		const county = components.find((c: any) => 
			c.types?.includes('administrative_area_level_2')
		);
		
		if (county && state) {
			return `${county.long_name}, ${state.short_name}`;
		}
		
		// Last resort - use formatted address
		return result.formatted_address || 'Unknown Location';
		
	} catch (error) {
		return 'Unknown Location';
	}
}

/**
 * Extract state code from geocoding result
 * 
 * @param result - Geocoding result with address_components
 * @returns State code (e.g., "OH") or null
 */
export function extractStateFromResult(result: any): string | null {
	try {
		const components = result?.address_components || [];
		const state = components.find((c: any) => 
			c.types?.includes('administrative_area_level_1')
		);
		return state?.short_name || null;
	} catch (error) {
		return null;
	}
}

/**
 * Extract coordinates from geocoding result
 * 
 * @param result - Geocoding result with geometry.location
 * @returns Coordinates or null
 */
export function extractCoordsFromResult(result: any): Coords | null {
	try {
		const location = result?.geometry?.location;
		if (location?.lat && location?.lng) {
			return { latitude: location.lat, longitude: location.lng };
		}
		return null;
	} catch (error) {
		return null;
	}
}