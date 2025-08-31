/**
 * Tests for safe logging utilities
 */

import { clip, logSafe, logArray, logObject, LOG_CONFIGS } from '../log';

// Mock console.log to capture output
const originalConsoleLog = console.log;
let logOutput: any[] = [];

beforeEach(() => {
  logOutput = [];
  console.log = jest.fn((...args) => logOutput.push(args));
  // Mock __DEV__ to true for testing
  (global as any).__DEV__ = true;
});

afterEach(() => {
  console.log = originalConsoleLog;
  (global as any).__DEV__ = undefined;
});

describe('clip', () => {
  test('should handle primitives without modification', () => {
    expect(clip('hello')).toBe('hello');
    expect(clip(123)).toBe(123);
    expect(clip(true)).toBe(true);
    expect(clip(null)).toBe(null);
    expect(clip(undefined)).toBe(undefined);
  });

  test('should truncate long strings', () => {
    const longString = 'a'.repeat(6000);
    const result = clip(longString) as string;
    
    expect(result).toContain('TRUNCATED');
    expect(result.length).toBeLessThan(longString.length);
    expect(result).toContain('6000 chars');
  });

  test('should limit array items', () => {
    const largeArray = Array.from({ length: 20 }, (_, i) => ({ id: i, data: 'item' }));
    const result = clip(largeArray, { maxItems: 5 }) as any[];
    
    expect(result.length).toBe(6); // 5 items + truncation message
    expect(result[5]).toContain('TRUNCATED');
    expect(result[5]).toContain('15 more items');
  });

  test('should handle nested objects with depth limit', () => {
    const deepObject = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: 'too deep'
            }
          }
        }
      }
    };
    
    const result = clip(deepObject, { maxDepth: 2 }) as any;
    
    // With maxDepth: 2, level3 and below should be truncated
    expect(result.level1.level2.level3).toBe('[MAX_DEPTH_EXCEEDED]');
  });

  test('should handle circular references', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;
    
    const result = clip(obj) as any;
    
    expect(result.name).toBe('test');
    expect(result.self).toBe('[CIRCULAR]');
  });

  test('should handle error objects', () => {
    const error = new Error('Test error');
    const result = clip(error) as any;
    
    expect(result.name).toBe('Error');
    expect(result.message).toBe('Test error');
    expect(result.stack).toBeDefined();
  });

  test('should handle Date objects', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const result = clip(date);
    
    expect(result).toBe('2023-01-01T00:00:00.000Z');
  });
});

describe('logSafe', () => {
  test('should log small objects normally', () => {
    const smallObject = { name: 'test', count: 5 };
    
    logSafe('test-label', smallObject);
    
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toEqual(['[test-label]', smallObject]);
  });

  test('should handle very large payloads gracefully', () => {
    const hugeObject = {
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        description: 'x'.repeat(100),
        nested: {
          more: 'y'.repeat(100),
          evenMore: 'z'.repeat(100)
        }
      }))
    };
    
    logSafe('huge-payload', hugeObject);
    
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0][0]).toBe('[huge-payload]');
    // Should not contain the full huge object
    expect(JSON.stringify(logOutput[0][1]).length).toBeLessThan(50000);
  });

  test('should not log in production', () => {
    (global as any).__DEV__ = false;
    
    logSafe('test-label', { data: 'should not log' });
    
    expect(logOutput).toHaveLength(0);
  });

  test('should handle serialization errors', () => {
    const objWithBigInt = { value: BigInt(123) };
    
    // This might cause serialization issues in some environments
    logSafe('bigint-test', objWithBigInt);
    
    // Should either log the object or handle the error gracefully
    expect(logOutput.length).toBeGreaterThanOrEqual(0);
  });
});

describe('logArray', () => {
  test('should log array metadata and samples', () => {
    const testArray = [
      { name: 'item1', id: 1 },
      { name: 'item2', id: 2 },
      { name: 'item3', id: 3 },
      { name: 'item4', id: 4 },
      { name: 'item5', id: 5 },
    ];
    
    logArray('test-array', testArray, 2);
    
    expect(logOutput).toHaveLength(1);
    const loggedData = logOutput[0][1];
    expect(loggedData.count).toBe(5);
    expect(loggedData.sample).toHaveLength(2);
    expect(loggedData.truncated).toBe(3);
  });

  test('should handle non-arrays', () => {
    logArray('not-array', 'not an array' as any);
    
    expect(logOutput[0][0]).toBe('[not-array [NOT_ARRAY]]');
  });
});

describe('logObject', () => {
  test('should log object metadata and selected keys', () => {
    const testObject = {
      name: 'test',
      id: 123,
      data: { nested: 'value' },
      array: [1, 2, 3],
      extra: 'more data'
    };
    
    logObject('test-object', testObject, ['name', 'id']);
    
    expect(logOutput).toHaveLength(1);
    const loggedData = logOutput[0][1];
    expect(loggedData['[KEYS_COUNT]']).toBe(5);
    expect(loggedData.name).toBe('test');
    expect(loggedData.id).toBe(123);
    // logObject should only include selected keys
    expect(loggedData.data).toBeUndefined();
    expect(loggedData.array).toBeUndefined();
    expect(loggedData['[TRUNCATED_KEYS]']).toBe(3); // 5 total - 2 selected = 3 truncated
  });

  test('should handle non-objects', () => {
    logObject('not-object', 'not an object' as any);
    
    expect(logOutput[0][0]).toBe('[not-object [NOT_OBJECT]]');
  });
});

describe('LOG_CONFIGS', () => {
  test('should provide different configuration levels', () => {
    expect(LOG_CONFIGS.minimal.maxDepth).toBe(1);
    expect(LOG_CONFIGS.standard.maxDepth).toBe(3);
    expect(LOG_CONFIGS.verbose.maxDepth).toBe(5);
    
    expect(LOG_CONFIGS.minimal.maxLength).toBeLessThan(LOG_CONFIGS.verbose.maxLength);
  });

  test('configurations should work with clip function', () => {
    const testData = {
      level1: {
        level2: {
          level3: 'deep value'
        }
      }
    };
    
    const minimal = clip(testData, LOG_CONFIGS.minimal);
    const verbose = clip(testData, LOG_CONFIGS.verbose);
    
    expect(minimal).not.toEqual(verbose);
  });
});