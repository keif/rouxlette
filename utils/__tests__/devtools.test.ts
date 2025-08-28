/**
 * Tests for devtools sanitization utilities
 */

import { sanitizeState, createContextLogger, DEFAULT_SANITIZE_CONFIG } from '../devtools';

describe('sanitizeState', () => {
  test('should handle primitive values without modification', () => {
    expect(sanitizeState('hello')).toBe('hello');
    expect(sanitizeState(123)).toBe(123);
    expect(sanitizeState(true)).toBe(true);
    expect(sanitizeState(null)).toBe(null);
    expect(sanitizeState(undefined)).toBe(undefined);
  });

  test('should redact sensitive fields by default', () => {
    const state = {
      apiKey: 'secret-key',
      password: 'secret-password',
      token: 'bearer-token',
      publicData: 'visible',
    };

    const sanitized = sanitizeState(state) as any;

    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.publicData).toBe('visible');
  });

  test('should handle custom sensitive fields', () => {
    const state = {
      userSecret: 'confidential',
      publicInfo: 'visible',
    };

    const sanitized = sanitizeState(state, {
      sensitiveFields: ['userSecret'],
    }) as any;

    expect(sanitized.userSecret).toBe('[REDACTED]');
    expect(sanitized.publicInfo).toBe('visible');
  });

  test('should truncate large arrays and show metadata', () => {
    const largeArray = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      data: `item-${i}`,
    }));

    const state = {
      items: largeArray,
      otherData: 'preserved',
    };

    const sanitized = sanitizeState(state, {
      maxItems: 3,
    }) as any;

    expect(sanitized.otherData).toBe('preserved');
    expect(sanitized.items).toEqual({
      '[ARRAY_METADATA]': {
        length: 100,
        sample: largeArray.slice(0, 3),
        truncated: 97,
      },
    });
  });

  test('should handle nested objects with depth limits', () => {
    const deepState = {
      level1: {
        level2: {
          level3: {
            level4: {
              tooDeep: 'should not appear',
            },
          },
        },
      },
    };

    const sanitized = sanitizeState(deepState, {
      maxDepth: 2,
    }) as any;

    expect(sanitized.level1.level2).toBe('[MAX_DEPTH_EXCEEDED]');
  });

  test('should handle large objects and provide metadata', () => {
    const largeObject = {};
    for (let i = 0; i < 200; i++) {
      (largeObject as any)[`key${i}`] = `value${i}`;
    }

    const state = {
      hugeObject: largeObject,
      smallData: 'preserved',
    };

    const sanitized = sanitizeState(state, {
      maxObjectKeys: 5,
    }) as any;

    expect(sanitized.smallData).toBe('preserved');
    expect(sanitized.hugeObject).toEqual({
      '[OBJECT_METADATA]': {
        keyCount: 200,
        sampleKeys: Object.keys(largeObject).slice(0, 5),
        truncated: 195,
      },
    });
  });

  test('should handle circular references', () => {
    const obj: any = {
      name: 'test',
      nested: {
        back: null,
      },
    };
    obj.nested.back = obj;

    const sanitized = sanitizeState(obj) as any;

    expect(sanitized.name).toBe('test');
    expect(sanitized.nested.back).toBe('[CIRCULAR]');
  });

  test('should handle mixed complex state', () => {
    const complexState = {
      // Sensitive data
      apiKey: 'secret',
      
      // Large array
      businesses: Array.from({ length: 50 }, (_, i) => ({
        id: `biz-${i}`,
        name: `Business ${i}`,
        details: {
          address: `${i} Main St`,
          phone: `555-000-${i.toString().padStart(4, '0')}`,
        },
      })),
      
      // Normal data
      filters: {
        categoryIds: ['restaurants', 'bars'],
        openNow: true,
      },
      
      // Large string
      description: 'x'.repeat(5000),
    };

    const sanitized = sanitizeState(complexState, {
      maxItems: 2,
      maxStringLength: 100,
    }) as any;

    expect(sanitized.apiKey).toBe('[REDACTED]');
    
    expect(sanitized.businesses).toEqual({
      '[ARRAY_METADATA]': {
        length: 50,
        sample: complexState.businesses.slice(0, 2),
        truncated: 48,
      },
    });

    expect(sanitized.filters).toEqual({
      categoryIds: ['restaurants', 'bars'],
      openNow: true,
    });

    expect(sanitized.description).toContain('[TRUNCATED');
    expect(sanitized.description.length).toBeLessThan(200);
  });

  test('should preserve error objects with safe serialization', () => {
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test (file.js:1:1)';

    const state = {
      lastError: error,
      otherData: 'preserved',
    };

    const sanitized = sanitizeState(state) as any;

    expect(sanitized.otherData).toBe('preserved');
    expect(sanitized.lastError).toEqual({
      name: 'Error',
      message: 'Test error',
      stack: error.stack,
    });
  });

  test('should handle Date objects', () => {
    const now = new Date('2023-01-01T00:00:00Z');
    const state = {
      timestamp: now,
      otherData: 'preserved',
    };

    const sanitized = sanitizeState(state) as any;

    expect(sanitized.timestamp).toBe('2023-01-01T00:00:00.000Z');
    expect(sanitized.otherData).toBe('preserved');
  });
});

describe('createContextLogger', () => {
  let mockConsole: jest.SpyInstance;
  
  beforeEach(() => {
    mockConsole = jest.spyOn(console, 'log').mockImplementation();
    (global as any).__DEV__ = true;
  });
  
  afterEach(() => {
    mockConsole.mockRestore();
    (global as any).__DEV__ = undefined;
  });

  test('should create logger that sanitizes state before logging', () => {
    const logger = createContextLogger('TestContext');
    
    const unsafeState = {
      apiKey: 'secret',
      businesses: Array.from({ length: 20 }, (_, i) => ({ id: i })),
      normalData: 'preserved',
    };

    logger('state-update', unsafeState);

    expect(mockConsole).toHaveBeenCalledWith(
      '[TestContext:state-update]',
      expect.objectContaining({
        apiKey: '[REDACTED]',
        businesses: expect.objectContaining({
          '[ARRAY_METADATA]': expect.any(Object),
        }),
        normalData: 'preserved',
      })
    );
  });

  test('should not log in production', () => {
    (global as any).__DEV__ = false;
    
    const logger = createContextLogger('TestContext');
    logger('test', { data: 'should not log' });

    expect(mockConsole).not.toHaveBeenCalled();
  });

  test('should handle custom sanitize config', () => {
    const logger = createContextLogger('TestContext', {
      maxItems: 1,
      sensitiveFields: ['customSecret'],
    });
    
    const state = {
      customSecret: 'hidden',
      items: [1, 2, 3],
      visible: 'shown',
    };

    logger('test', state);

    expect(mockConsole).toHaveBeenCalledWith(
      '[TestContext:test]',
      expect.objectContaining({
        customSecret: '[REDACTED]',
        items: expect.objectContaining({
          '[ARRAY_METADATA]': expect.objectContaining({
            length: 3,
            truncated: 2,
          }),
        }),
        visible: 'shown',
      })
    );
  });

  test('should provide performance timing for expensive sanitization', () => {
    const logger = createContextLogger('TestContext', {
      enableTiming: true,
    });
    
    // Create a large state that will take time to sanitize
    const largeState = {
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        nested: {
          deep: Array.from({ length: 100 }, (_, j) => `item-${i}-${j}`),
        },
      })),
    };

    logger('performance-test', largeState);

    // Should log timing information
    const logCalls = mockConsole.mock.calls;
    const timingCall = logCalls.find(call => 
      call[0].includes('sanitize-timing')
    );
    
    expect(timingCall).toBeDefined();
    expect(timingCall[1]).toEqual(expect.objectContaining({
      duration: expect.any(Number),
      operation: 'sanitizeState',
    }));
  });
});

describe('sanitization performance', () => {
  test('should handle very large states without timeout', () => {
    // Create an extremely large state
    const massiveState = {
      businesses: Array.from({ length: 5000 }, (_, i) => ({
        id: `business-${i}`,
        name: `Business ${i}`,
        location: {
          address: `${i} Main Street`,
          city: 'Test City',
          coordinates: {
            lat: 40.7128 + Math.random(),
            lng: -74.0060 + Math.random(),
          },
        },
        reviews: Array.from({ length: 100 }, (_, j) => ({
          id: `review-${i}-${j}`,
          text: 'x'.repeat(500), // 500 char review
          rating: Math.floor(Math.random() * 5) + 1,
        })),
      })),
    };

    const startTime = performance.now();
    const sanitized = sanitizeState(massiveState, {
      maxItems: 5,
      maxDepth: 2,
    });
    const duration = performance.now() - startTime;

    // Should complete within reasonable time (< 100ms)
    expect(duration).toBeLessThan(100);
    
    // Should be dramatically smaller than original
    const originalSize = JSON.stringify(massiveState).length;
    const sanitizedSize = JSON.stringify(sanitized).length;
    
    expect(sanitizedSize).toBeLessThan(originalSize * 0.01); // < 1% of original
  });
});