/**
 * Tests for devtools sanitization utilities
 */

import { sanitizeState, createContextLogger } from '../devtools';

describe('sanitizeState', () => {
  test('should handle primitive values without modification', () => {
    expect(sanitizeState('hello')).toBe('hello');
    expect(sanitizeState(123)).toBe(123);
    expect(sanitizeState(true)).toBe(true);
    expect(sanitizeState(null)).toBe(null);
    expect(sanitizeState(undefined)).toBe(undefined);
  });

  test('should redact fields specified in redactFields', () => {
    const state = {
      photos: ['photo1.jpg', 'photo2.jpg'],
      display_address: ['123 Main St', 'City, State'],
      transactions: ['pickup', 'delivery'],
      publicData: 'visible',
    };

    const sanitized = sanitizeState(state) as any;

    expect(sanitized.photos).toBe('[REDACTED]');
    expect(sanitized.display_address).toBe('[REDACTED]');
    expect(sanitized.transactions).toBe('[REDACTED]');
    expect(sanitized.publicData).toBe('visible');
  });

  test('should handle custom redact fields', () => {
    const state = {
      userSecret: 'confidential',
      publicInfo: 'visible',
    };

    const sanitized = sanitizeState(state, {
      redactFields: ['userSecret'],
    }) as any;

    expect(sanitized.userSecret).toBe('[REDACTED]');
    expect(sanitized.publicInfo).toBe('visible');
  });

  test('should show metadata for metadataOnlyFields', () => {
    const businesses = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Business ${i}`,
    }));

    const state = {
      businesses,
      otherData: 'preserved',
    };

    const sanitized = sanitizeState(state) as any;

    expect(sanitized.otherData).toBe('preserved');
    expect(sanitized.businesses).toContain('Array(100)');
    expect(sanitized.businesses).toContain('Business 0');
  });

  test('should limit array items to maxItems', () => {
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
    expect(Array.isArray(sanitized.items)).toBe(true);
    expect(sanitized.items.length).toBeLessThanOrEqual(3);
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
      // Large array with metadataOnlyFields
      businesses: Array.from({ length: 50 }, (_, i) => ({
        id: `biz-${i}`,
        name: `Business ${i}`,
      })),

      // Normal data
      filters: {
        categoryIds: ['restaurants', 'bars'],
        openNow: true,
      },

      // Redacted field
      photos: ['photo1.jpg', 'photo2.jpg'],
    };

    const sanitized = sanitizeState(complexState) as any;

    // businesses is in default metadataOnlyFields
    expect(sanitized.businesses).toContain('Array(50)');

    // filters should be preserved
    expect(sanitized.filters).toEqual({
      categoryIds: ['restaurants', 'bars'],
      openNow: true,
    });

    // photos is in default redactFields
    expect(sanitized.photos).toBe('[REDACTED]');
  });
});

describe('createContextLogger', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleGroup: jest.SpyInstance;
  let mockConsoleGroupEnd: jest.SpyInstance;

  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleGroup = jest.spyOn(console, 'group').mockImplementation();
    mockConsoleGroupEnd = jest.spyOn(console, 'groupEnd').mockImplementation();
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleGroup.mockRestore();
    mockConsoleGroupEnd.mockRestore();
    (global as any).__DEV__ = undefined;
  });

  test('should create logger with logStateChange method', () => {
    const logger = createContextLogger('TestContext');

    const oldState = {
      count: 0,
      businesses: [],
    };

    const newState = {
      count: 1,
      businesses: [{ id: '1', name: 'Test' }],
    };

    const action = { type: 'INCREMENT', payload: undefined };

    logger.logStateChange(action, oldState, newState);

    expect(mockConsoleGroup).toHaveBeenCalledWith('[TestContext] INCREMENT');
    expect(mockConsoleLog).toHaveBeenCalledWith('Action:', expect.any(Object));
    expect(mockConsoleLog).toHaveBeenCalledWith('Old State:', expect.any(Object));
    expect(mockConsoleLog).toHaveBeenCalledWith('New State:', expect.any(Object));
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
  });

  test('should create logger with logCurrentState method', () => {
    const logger = createContextLogger('TestContext');

    const state = {
      photos: ['photo1.jpg'], // Should be redacted
      normalData: 'preserved',
    };

    logger.logCurrentState(state, 'Test Label');

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[TestContext] Test Label:',
      expect.objectContaining({
        photos: '[REDACTED]',
        normalData: 'preserved',
      })
    );
  });

  test('should create logger with logAction method', () => {
    const logger = createContextLogger('TestContext');

    const action = { type: 'TEST_ACTION', payload: { data: 'test' } };

    logger.logAction(action);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[TestContext] Action:',
      expect.objectContaining({
        type: 'TEST_ACTION',
        payload: expect.any(Object),
      })
    );
  });

  test('should not log in production', () => {
    (global as any).__DEV__ = false;

    const logger = createContextLogger('TestContext');
    const state = { data: 'should not log' };

    logger.logCurrentState(state);
    logger.logAction({ type: 'TEST' });

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleGroup).not.toHaveBeenCalled();
  });

  test('should handle custom sanitize config', () => {
    const logger = createContextLogger('TestContext', {
      maxItems: 1,
      redactFields: ['customSecret'],
    });

    const state = {
      customSecret: 'hidden',
      items: [1, 2, 3],
      visible: 'shown',
    };

    logger.logCurrentState(state);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        customSecret: '[REDACTED]',
        visible: 'shown',
      })
    );
  });
});

describe('sanitization performance', () => {
  test('should handle very large states without timeout', () => {
    // Create a large state
    const largeState = {
      businesses: Array.from({ length: 1000 }, (_, i) => ({
        id: `business-${i}`,
        name: `Business ${i}`,
        location: {
          address: `${i} Main Street`,
          city: 'Test City',
        },
      })),
    };

    const startTime = performance.now();
    const sanitized = sanitizeState(largeState, {
      maxItems: 5,
    });
    const duration = performance.now() - startTime;

    // Should complete within reasonable time (< 100ms)
    expect(duration).toBeLessThan(100);

    // businesses should be sanitized to metadata string
    expect(typeof (sanitized as any).businesses).toBe('string');
    expect((sanitized as any).businesses).toContain('Array(1000)');
  });
});