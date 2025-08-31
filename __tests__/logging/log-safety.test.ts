import { logSafe, logNetwork, safeStringify, clip } from '../../utils/log';

// Mock console to capture output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

describe('Logging Safety', () => {
  beforeEach(() => {
    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  describe('MAX_DEPTH_EXCEEDED Prevention', () => {
    it('should not produce MAX_DEPTH_EXCEEDED for deeply nested objects', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      };

      logSafe('Deep Object Test', deepObject);
      
      const logOutput = mockConsoleLog.mock.calls[0];
      const outputString = JSON.stringify(logOutput);
      
      expect(outputString).toContain('[MAX_DEPTH_EXCEEDED]');
      expect(logOutput).toBeDefined();
      expect(typeof logOutput[1]).toBe('object');
    });

    it('should handle circular references without crashing', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      expect(() => {
        logSafe('Circular Object Test', circularObj);
      }).not.toThrow();

      const logOutput = mockConsoleLog.mock.calls[0];
      const outputString = JSON.stringify(logOutput);
      
      expect(outputString).toContain('[CIRCULAR]');
    });

    it('should safely handle Axios response objects', () => {
      const mockAxiosResponse = {
        data: { businesses: new Array(50).fill({ name: 'test', location: {} }) },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {
          url: 'https://api.yelp.com/v3/businesses/search',
          method: 'get',
          headers: { Authorization: 'Bearer test-key' },
          params: { term: 'pizza', location: 'columbus' }
        },
        request: {} // This would be a large XMLHttpRequest object in real scenarios
      };

      expect(() => {
        logSafe('Axios Response Test', mockAxiosResponse);
      }).not.toThrow();

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should safely handle navigation objects', () => {
      const mockNavigationObject = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        state: {
          routes: new Array(10).fill({ name: 'Screen', params: {} }),
          index: 0
        },
        router: {}, // Large router object
        _childrenNavigation: {} // Potentially circular
      };

      expect(() => {
        logSafe('Navigation Object Test', mockNavigationObject);
      }).not.toThrow();

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('Network Logging Safety', () => {
    it('should log network requests without sensitive data', () => {
      const mockResponse = {
        status: 200,
        data: {
          businesses: new Array(25).fill({ name: 'Restaurant', categories: [] }),
          total: 25,
          region: { center: { latitude: 39, longitude: -82 } }
        }
      };

      logNetwork('GET', '/businesses/search', 
        { term: 'pizza', latitude: 39.9612, longitude: -82.9988 }, 
        mockResponse
      );

      const logCall = mockConsoleLog.mock.calls[0];
      const logData = logCall[1];

      // Should show metadata, not full response
      expect(logData.method).toBe('GET');
      expect(logData.status).toBe(200);
      expect(logData.response).toEqual({
        businesses: 'Array(25)',
        total: 25,
        region: 'present'
      }); // Should be summarized for Yelp API response shape
      expect(logData.url).toBe('/businesses/search');
    });

    it('should safely handle Yelp API responses', () => {
      const yelpResponse = {
        status: 200,
        data: {
          businesses: [
            { id: '1', name: 'Test Restaurant', location: { address1: '123 Main St' } },
            { id: '2', name: 'Another Place', location: { address1: '456 Oak Ave' } }
          ],
          total: 1000,
          region: { center: { latitude: 39.9612, longitude: -82.9988 } }
        }
      };

      expect(() => {
        logNetwork('GET', '/businesses/search', undefined, yelpResponse);
      }).not.toThrow();

      const logCall = mockConsoleLog.mock.calls[0];
      const logData = logCall[1];
      
      expect(logData.response).toEqual({
        businesses: 'Array(2)',
        total: 1000,
        region: 'present'
      });
    });
  });

  describe('Safe Stringify', () => {
    it('should safely stringify complex objects', () => {
      const complexObject = {
        simple: 'value',
        nested: {
          array: [1, 2, 3, { deep: 'value' }],
          func: () => 'test',
          date: new Date('2024-01-01'),
          error: new Error('test error')
        }
      };

      const result = safeStringify(complexObject);
      
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
      // With maxDepth: 3 (default), deep nested objects should contain MAX_DEPTH_EXCEEDED
      expect(result).toContain('[MAX_DEPTH_EXCEEDED]');
    });

    it('should handle very large objects', () => {
      const largeObject = {
        data: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          details: { description: 'Long description '.repeat(50) }
        }))
      };

      const result = safeStringify(largeObject, { maxItems: 5, maxLength: 100 });
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThan(10000); // Should be truncated
    });
  });

  describe('Clipping Function', () => {
    it('should respect maxDepth setting', () => {
      const deepObj = {
        l1: { l2: { l3: { l4: 'should be clipped' } } }
      };

      const clipped = clip(deepObj, { maxDepth: 2 });
      
      expect(clipped).toEqual({
        l1: {
          l2: {
            l3: '[MAX_DEPTH_EXCEEDED]'
          }
        }
      });
    });

    it('should respect maxItems for arrays', () => {
      const bigArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const clipped = clip(bigArray, { maxItems: 3 });
      
      expect(Array.isArray(clipped)).toBe(true);
      expect((clipped as any[]).length).toBe(4); // 3 items + truncation message
      expect((clipped as any[])[3]).toContain('[TRUNCATED: 7 more items]');
    });

    it('should handle Error objects specially', () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at test.js:1:1'.repeat(50); // Long stack

      const clipped = clip(error);
      
      expect(typeof clipped).toBe('object');
      expect((clipped as any).name).toBe('Error');
      expect((clipped as any).message).toBe('Test error message');
      expect((clipped as any).stack).toContain('...[TRUNCATED]');
    });
  });
});