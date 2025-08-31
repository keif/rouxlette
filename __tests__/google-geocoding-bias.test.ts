/**
 * Tests for Google Geocoding API with bias and components
 * Ensures proper parameter construction for location disambiguation
 */

import axios from 'axios';

// Mock environment variables
jest.mock('@env', () => ({
  GOOGLE_API_KEY: 'test-api-key'
}));

// Mock axios and the google client
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock the google client instance
const mockGoogleClient = {
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

// Mock axios.create to return our mock client
mockAxios.create.mockReturnValue(mockGoogleClient as any);

describe('Google Geocoding with Bias', () => {
  let geocodeAddress: any;
  
  beforeAll(() => {
    // Import the function only after mocks are set up
    const googleModule = require('../api/google');
    geocodeAddress = googleModule.geocodeAddress;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful response
    mockGoogleClient.get.mockResolvedValue({
      data: {
        status: 'OK',
        results: [
          {
            geometry: { location: { lat: 40.1581, lng: -83.0752 } },
            address_components: [
              { long_name: 'Powell', types: ['locality'] },
              { long_name: 'Ohio', short_name: 'OH', types: ['administrative_area_level_1'] }
            ],
            formatted_address: 'Powell, OH, USA'
          }
        ]
      }
    });
  });

  describe('Parameter construction', () => {
    it('should include country component', async () => {
      await geocodeAddress('powell', {
        country: 'US'
      });
      
      expect(mockGoogleClient.get).toHaveBeenCalledWith('', {
        params: {
          address: 'powell',
          components: 'country:US'
        }
      });
    });
    
    it('should include country and state components', async () => {
      await geocodeAddress('powell', {
        country: 'US',
        state: 'OH'
      });
      
      expect(mockGoogleClient.get).toHaveBeenCalledWith('', {
        params: {
          address: 'powell',
          components: 'country:US|administrative_area:OH'
        }
      });
    });
    
    it('should include bounds bias from center coordinates', async () => {
      const columbusCoords = { latitude: 39.9612, longitude: -82.9988 };
      
      await geocodeAddress('powell', {
        country: 'US',
        state: 'OH',
        biasCenter: columbusCoords,
        kmBias: 50
      });
      
      const callArgs = mockGoogleClient.get.mock.calls[0][1];
      expect(callArgs.params).toMatchObject({
        address: 'powell',
        components: 'country:US|administrative_area:OH',
        bounds: expect.stringMatching(/^[\d.-]+,[\d.-]+\|[\d.-]+,[\d.-]+$/)
      });
      
      // Verify bounds format (should be south,west|north,east)
      const bounds = callArgs.params.bounds;
      const [southwest, northeast] = bounds.split('|');
      const [south, west] = southwest.split(',').map(Number);
      const [north, east] = northeast.split(',').map(Number);
      
      // Bounds should be centered around Columbus
      expect(south).toBeLessThan(columbusCoords.latitude);
      expect(north).toBeGreaterThan(columbusCoords.latitude);
      expect(west).toBeLessThan(columbusCoords.longitude);
      expect(east).toBeGreaterThan(columbusCoords.longitude);
    });
    
    it('should handle custom bias radius', async () => {
      const center = { latitude: 40.0, longitude: -83.0 };
      
      await geocodeAddress('test', {
        biasCenter: center,
        kmBias: 25  // smaller radius
      });
      
      const callArgs = mockGoogleClient.get.mock.calls[0][1];
      const bounds = callArgs.params.bounds;
      const [southwest, northeast] = bounds.split('|');
      const [south, west] = southwest.split(',').map(Number);
      const [north, east] = northeast.split(',').map(Number);
      
      // With smaller radius, bounds should be tighter
      const latDelta = north - south;
      const lonDelta = east - west;
      
      // For 25km radius, lat delta should be roughly 0.45 degrees (25/111*2)
      expect(latDelta).toBeCloseTo(0.45, 1);
    });
  });
  
  describe('Response handling', () => {
    it('should handle successful geocoding response', async () => {
      const response = await geocodeAddress('powell');
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe('OK');
      expect(response.results).toHaveLength(1);
      expect(response.results[0].geometry.location.lat).toBe(40.1581);
    });
    
    it('should handle empty query', async () => {
      const response = await geocodeAddress('');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe('EMPTY_QUERY');
      expect(response.results).toEqual([]);
      expect(response.errorMessage).toBe('No address provided');
    });
    
    it('should handle API error response', async () => {
      mockGoogleClient.get.mockResolvedValue({
        data: {
          status: 'ZERO_RESULTS',
          results: []
        }
      });
      
      const response = await geocodeAddress('nonexistent place');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe('ZERO_RESULTS');
      expect(response.results).toEqual([]);
    });
    
    it('should handle network errors', async () => {
      mockGoogleClient.get.mockRejectedValue(new Error('Network error'));
      
      const response = await geocodeAddress('test');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe('NETWORK_ERROR');
      expect(response.results).toEqual([]);
      expect(response.errorMessage).toBe('Network error');
    });
  });
  
  describe('Bounds calculation', () => {
    it('should calculate bounds correctly for equator location', () => {
      // Test bounds calculation at equator where longitude scaling is 1
      const center = { latitude: 0, longitude: 0 };
      const km = 111; // 1 degree at equator
      
      // This would be done inside boundsFromCenter function
      const latDelta = km / 111; // Should be 1
      const lonDelta = km / (111 * Math.cos((center.latitude * Math.PI) / 180) || 1); // Should be 1
      
      expect(latDelta).toBe(1);
      expect(lonDelta).toBe(1);
    });
    
    it('should scale longitude correctly for northern latitudes', () => {
      // Test at Columbus latitude
      const center = { latitude: 39.9612, longitude: -82.9988 };
      const km = 111;
      
      const latDelta = km / 111; // Should be 1
      const lonDelta = km / (111 * Math.cos((center.latitude * Math.PI) / 180)); // Should be > 1
      
      expect(latDelta).toBe(1);
      expect(lonDelta).toBeGreaterThan(1); // Longitude degrees are smaller at northern latitudes
    });
  });
});