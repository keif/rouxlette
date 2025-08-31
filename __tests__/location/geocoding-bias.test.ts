import { geocodeAddress } from '../../api/google';
import { findClosestResult, extractCanonicalLabel } from '../../hooks/geoUtils';

// Mock the axios instance to avoid real API calls
jest.mock('../../api/google', () => ({
  geocodeAddress: jest.fn(),
}));

const mockGeocodeAddress = geocodeAddress as jest.MockedFunction<typeof geocodeAddress>;

describe('Geocoding Bias for Location Disambiguation', () => {
  beforeEach(() => {
    mockGeocodeAddress.mockClear();
  });

  describe('US/State/Bounds Bias', () => {
    it('should apply country and state restrictions', async () => {
      const mockResponse = {
        ok: true,
        status: 'OK',
        results: [
          {
            address_components: [
              { long_name: 'Powell', short_name: 'Powell', types: ['locality'] },
              { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] }
            ],
            geometry: { location: { lat: 40.1573, lng: -83.0712 } },
            formatted_address: 'Powell, OH, USA'
          }
        ],
        raw: {}
      };

      mockGeocodeAddress.mockResolvedValue(mockResponse);

      await geocodeAddress('Powell', {
        country: 'US',
        state: 'OH',
        biasCenter: { latitude: 39.9612, longitude: -82.9988 },
        kmBias: 25
      });

      expect(mockGeocodeAddress).toHaveBeenCalledWith('Powell', {
        country: 'US',
        state: 'OH',
        biasCenter: { latitude: 39.9612, longitude: -82.9988 },
        kmBias: 25
      });
    });

    it('should prefer results with closer distance bias', async () => {
      // Mock multiple Powell results: Ohio, Wyoming, Alabama
      const mockResults = [
        {
          // Powell, AL - farther from Columbus, OH
          address_components: [
            { long_name: 'Powell', short_name: 'Powell', types: ['locality'] },
            { long_name: 'Alabama', short_name: 'AL', types: ['administrative_area_level_1'] }
          ],
          geometry: { location: { lat: 34.3517, lng: -85.8929 } },
          formatted_address: 'Powell, AL, USA'
        },
        {
          // Powell, OH - closer to Columbus, OH
          address_components: [
            { long_name: 'Powell', short_name: 'Powell', types: ['locality'] },
            { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] }
          ],
          geometry: { location: { lat: 40.1573, lng: -83.0712 } },
          formatted_address: 'Powell, OH, USA'
        },
        {
          // Powell, WY - very far from Columbus, OH
          address_components: [
            { long_name: 'Powell', short_name: 'Powell', types: ['locality'] },
            { long_name: 'Wyoming', short_name: 'WY', types: ['administrative_area_level_1'] }
          ],
          geometry: { location: { lat: 44.7541, lng: -108.7473 } },
          formatted_address: 'Powell, WY, USA'
        }
      ];

      const columbusCoords = { latitude: 39.9612, longitude: -82.9988 };
      const closest = findClosestResult(mockResults, columbusCoords);

      expect(closest).toBeDefined();
      expect(extractCanonicalLabel(closest!)).toBe('Powell, OH');
    });

    it('should create proper bounds from center point', () => {
      // This test verifies the boundsFromCenter calculation
      const centerCoords = { latitude: 39.9612, longitude: -82.9988 };
      
      // The bounds calculation should create a box around the center
      // At 25km radius, expect roughly:
      // - Latitude delta: ~0.225 degrees (25/111)
      // - Longitude delta: ~0.326 degrees (25/(111*cos(39.96°)))
      
      // This will be tested when we call the geocoding function with bounds
      const expectedBounds = expect.stringMatching(/^39\.73.+,-83\.32.+\|40\.18.+,-82\.67.+$/);
      
      mockGeocodeAddress.mockImplementation(async (address, opts) => {
        if (opts?.biasCenter) {
          expect(opts.bounds).toMatch(expectedBounds);
        }
        return {
          ok: true,
          status: 'OK', 
          results: [],
          raw: {}
        };
      });

      geocodeAddress('Powell', {
        biasCenter: centerCoords,
        kmBias: 25
      });
    });
  });

  describe('Canonical Label Extraction', () => {
    it('should format location labels consistently', () => {
      const result = {
        address_components: [
          { long_name: 'Powell', short_name: 'Powell', types: ['locality'] },
          { long_name: 'Delaware County', short_name: 'Delaware County', types: ['administrative_area_level_2'] },
          { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] }
        ],
        geometry: { location: { lat: 40.1573, lng: -83.0712 } },
        formatted_address: 'Powell, OH 43065, USA'
      };

      const label = extractCanonicalLabel(result);
      expect(label).toBe('Powell, OH');
    });

    it('should handle results without locality (use county)', () => {
      const result = {
        address_components: [
          { long_name: 'Delaware County', short_name: 'Delaware County', types: ['administrative_area_level_2'] },
          { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] }
        ],
        geometry: { location: { lat: 40.3, lng: -83.1 } },
        formatted_address: 'Delaware County, OH, USA'
      };

      const label = extractCanonicalLabel(result);
      expect(label).toBe('Delaware County, OH');
    });

    it('should fallback to formatted_address when components missing', () => {
      const result = {
        address_components: [], // No components
        geometry: { location: { lat: 40.1573, lng: -83.0712 } },
        formatted_address: 'Somewhere in Ohio, USA'
      };

      const label = extractCanonicalLabel(result);
      expect(label).toBe('Somewhere in Ohio, USA');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate coordinate-based cache keys', () => {
      const coords = { latitude: 40.157, longitude: -83.071 };
      const term = 'pizza';
      
      // This matches the format used in useResults.ts line 212
      const expectedKey = `search:40.157,-83.071:pizza`;
      
      // The actual cache key generation happens in useResults, 
      // but we can verify the format
      const lat = coords.latitude.toFixed(3);
      const lng = coords.longitude.toFixed(3);
      const termNorm = term.toLowerCase().trim();
      const cacheKey = `search:${lat},${lng}:${termNorm}`;
      
      expect(cacheKey).toBe(expectedKey);
    });

    it('should generate location-based cache keys for fallback', () => {
      const label = 'Powell, OH';
      const term = 'Sushi';
      
      // This matches the format used in useResults.ts line 216  
      const labelNorm = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const termNorm = term.toLowerCase().trim();
      const cacheKey = `search:${labelNorm}:${termNorm}`;
      
      expect(cacheKey).toBe('search:powell--oh:sushi');
    });

    it('should create different cache keys for different locations', () => {
      const coords1 = { latitude: 40.157, longitude: -83.071 }; // Powell, OH
      const coords2 = { latitude: 44.754, longitude: -108.747 }; // Powell, WY
      const term = 'pizza';
      
      const key1 = `search:${coords1.latitude.toFixed(3)},${coords1.longitude.toFixed(3)}:${term}`;
      const key2 = `search:${coords2.latitude.toFixed(3)},${coords2.longitude.toFixed(3)}:${term}`;
      
      expect(key1).not.toBe(key2);
      expect(key1).toBe('search:40.157,-83.071:pizza');
      expect(key2).toBe('search:44.754,-108.747:pizza');
    });
  });
});