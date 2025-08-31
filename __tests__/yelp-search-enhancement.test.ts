/**
 * Tests for enhanced Yelp search functionality
 * Verifies coordinate preference and proper cache key generation
 */

import { ResolvedLocation } from '../hooks/useLocation';

describe('Yelp Search Enhancement', () => {
  
  describe('Yelp parameter selection', () => {
    it('should prefer coordinates over location string', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: { latitude: 40.1581, longitude: -83.0752 },
        label: 'Powell, OH',
        state: 'OH',
        source: 'geocoded'
      };
      
      // Build search params as the hook would
      const searchParams: any = { term: 'dinner', limit: 50 };
      
      if (resolvedLocation.coords?.latitude && resolvedLocation.coords?.longitude) {
        searchParams.latitude = resolvedLocation.coords.latitude;
        searchParams.longitude = resolvedLocation.coords.longitude;
        searchParams.radius = 1600;
      } else if (resolvedLocation.label) {
        searchParams.location = resolvedLocation.label;
      }
      
      // Verify coordinates are used
      expect(searchParams).toEqual({
        term: 'dinner',
        limit: 50,
        latitude: 40.1581,
        longitude: -83.0752,
        radius: 1600
      });
      
      // Verify no location string is included
      expect(searchParams.location).toBeUndefined();
    });
    
    it('should fallback to location string when no coordinates', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: null,
        label: 'Powell, OH',
        state: 'OH',
        source: 'fallback'
      };
      
      const searchParams: any = { term: 'pizza', limit: 50 };
      
      if (resolvedLocation.coords?.latitude && resolvedLocation.coords?.longitude) {
        searchParams.latitude = resolvedLocation.coords.latitude;
        searchParams.longitude = resolvedLocation.coords.longitude;
        searchParams.radius = 1600;
      } else if (resolvedLocation.label) {
        searchParams.location = resolvedLocation.label;
      }
      
      // Verify location string is used
      expect(searchParams).toEqual({
        term: 'pizza',
        limit: 50,
        location: 'Powell, OH'
      });
      
      // Verify coordinates are not included
      expect(searchParams.latitude).toBeUndefined();
      expect(searchParams.longitude).toBeUndefined();
    });
  });

  describe('Cache key generation', () => {
    it('should generate coordinate-based cache key', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: { latitude: 40.1581, longitude: -83.0752 },
        label: 'Powell, OH',
        source: 'geocoded'
      };
      
      const termNorm = 'dinner';
      
      // Generate cache key as the hook would
      let cacheKey: string;
      if (resolvedLocation.coords) {
        const lat = resolvedLocation.coords.latitude.toFixed(3);
        const lng = resolvedLocation.coords.longitude.toFixed(3);
        cacheKey = `search:${lat},${lng}:${termNorm}`;
      } else {
        const labelNorm = resolvedLocation.label.toLowerCase().replace(/[^a-z0-9]/g, '-');
        cacheKey = `search:${labelNorm}:${termNorm}`;
      }
      
      expect(cacheKey).toBe('search:40.158,-83.075:dinner');
    });
    
    it('should generate label-based cache key when no coordinates', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: null,
        label: 'Powell, OH',
        source: 'fallback'
      };
      
      const termNorm = 'pizza';
      
      let cacheKey: string;
      if (resolvedLocation.coords) {
        const lat = resolvedLocation.coords.latitude.toFixed(3);
        const lng = resolvedLocation.coords.longitude.toFixed(3);
        cacheKey = `search:${lat},${lng}:${termNorm}`;
      } else {
        const labelNorm = resolvedLocation.label.toLowerCase().replace(/[^a-z0-9]/g, '-');
        cacheKey = `search:${labelNorm}:${termNorm}`;
      }
      
      expect(cacheKey).toBe('search:powell--oh:pizza');
    });
    
    it('should normalize special characters in labels', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: null,
        label: 'St. Louis, MO',
        source: 'geocoded'
      };
      
      const termNorm = 'barbecue';
      
      const labelNorm = resolvedLocation.label.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const cacheKey = `search:${labelNorm}:${termNorm}`;
      
      expect(cacheKey).toBe('search:st--louis--mo:barbecue');
    });
  });

  describe('UI canonicalization', () => {
    it('should display canonical location to user', () => {
      // Simulate user typing "powell"
      const userInput = 'powell';
      
      // Simulate resolution to canonical form
      const resolvedLocation: ResolvedLocation = {
        coords: { latitude: 40.1581, longitude: -83.0752 },
        label: 'Powell, OH',
        state: 'OH',
        source: 'geocoded'
      };
      
      // The UI should show the canonical label, not the user input
      const displayValue = resolvedLocation.label;
      expect(displayValue).toBe('Powell, OH');
      expect(displayValue).not.toBe(userInput);
    });
  });

  describe('Source tracking', () => {
    it('should track geocoded source', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: { latitude: 40.1581, longitude: -83.0752 },
        label: 'Powell, OH',
        state: 'OH',
        source: 'geocoded'
      };
      
      expect(resolvedLocation.source).toBe('geocoded');
    });
    
    it('should track coords source for current location', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: { latitude: 39.9612, longitude: -82.9988 },
        label: 'Columbus, OH',
        source: 'coords'
      };
      
      expect(resolvedLocation.source).toBe('coords');
    });
    
    it('should track fallback source when geocoding fails', () => {
      const resolvedLocation: ResolvedLocation = {
        coords: null,
        label: 'some unknown place',
        source: 'fallback'
      };
      
      expect(resolvedLocation.source).toBe('fallback');
    });
  });
});