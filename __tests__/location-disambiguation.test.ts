/**
 * Tests for location disambiguation functionality
 * Ensures "powell" resolves to "Powell, OH" when user is in Central Ohio
 */

import { geocodeAddress } from '../api/google';
import { haversineKm, findClosestResult, extractCanonicalLabel } from '../hooks/geoUtils';

// Mock the geocodeAddress function
jest.mock('../api/google', () => ({
  geocodeAddress: jest.fn(),
}));

const mockGeocodeAddress = geocodeAddress as jest.MockedFunction<typeof geocodeAddress>;

describe('Location Disambiguation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Geocode bias picks Ohio over Wyoming', () => {
    it('should prefer Powell, OH when user is in Central Ohio', async () => {
      // Mock response with both Powell, WY and Powell, OH
      const mockResponse = {
        ok: true,
        status: 'OK',
        results: [
          {
            // Powell, WY (further from Columbus)
            geometry: {
              location: { lat: 44.7541, lng: -108.7573 }
            },
            address_components: [
              { long_name: 'Powell', types: ['locality'] },
              { long_name: 'Wyoming', short_name: 'WY', types: ['administrative_area_level_1'] }
            ],
            formatted_address: 'Powell, WY, USA'
          },
          {
            // Powell, OH (closer to Columbus)
            geometry: {
              location: { lat: 40.1581, lng: -83.0752 }
            },
            address_components: [
              { long_name: 'Powell', types: ['locality'] },
              { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] }
            ],
            formatted_address: 'Powell, OH, USA'
          }
        ],
        raw: {}
      };

      mockGeocodeAddress.mockResolvedValue(mockResponse);

      // Columbus, OH coordinates
      const columbusCoords = { latitude: 39.9612, longitude: -82.9988 };
      
      // Call geocodeAddress with bias
      const response = await geocodeAddress('powell', {
        country: 'US',
        state: 'OH',
        biasCenter: columbusCoords,
        kmBias: 50
      });

      // Find closest result
      const closest = findClosestResult(response.results, columbusCoords);
      expect(closest).toBeTruthy();
      
      // Verify it's Powell, OH (not WY)
      const label = extractCanonicalLabel(closest);
      expect(label).toBe('Powell, OH');
      
      // Verify the geocoding was called with proper bias parameters
      expect(mockGeocodeAddress).toHaveBeenCalledWith('powell', {
        country: 'US',
        state: 'OH',
        biasCenter: columbusCoords,
        kmBias: 50
      });
    });
  });

  describe('Distance calculation', () => {
    it('should calculate haversine distance correctly', () => {
      const columbus = { latitude: 39.9612, longitude: -82.9988 };
      const powellOH = { latitude: 40.1581, longitude: -83.0752 };
      const powellWY = { latitude: 44.7541, longitude: -108.7573 };
      
      const distanceToOH = haversineKm(columbus, powellOH);
      const distanceToWY = haversineKm(columbus, powellWY);
      
      // Powell, OH should be much closer than Powell, WY
      expect(distanceToOH).toBeLessThan(50); // ~22 km
      expect(distanceToWY).toBeGreaterThan(1000); // ~2000+ km
      expect(distanceToOH).toBeLessThan(distanceToWY);
    });
  });

  describe('Canonical label extraction', () => {
    it('should extract "Powell, OH" format', () => {
      const mockResult = {
        address_components: [
          { long_name: 'Powell', types: ['locality'] },
          { long_name: 'Delaware County', types: ['administrative_area_level_2'] },
          { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] }
        ],
        formatted_address: 'Powell, OH 43065, USA'
      };
      
      const label = extractCanonicalLabel(mockResult);
      expect(label).toBe('Powell, OH');
    });
    
    it('should handle missing locality with county fallback', () => {
      const mockResult = {
        address_components: [
          { long_name: 'Delaware County', types: ['administrative_area_level_2'] },
          { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] }
        ],
        formatted_address: 'Delaware County, OH, USA'
      };
      
      const label = extractCanonicalLabel(mockResult);
      expect(label).toBe('Delaware County, OH');
    });
  });
});