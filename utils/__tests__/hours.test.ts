import { formatTodayHours, getHoursFallback, getTodayHours } from '../hours';

// Store original Date constructor
const OriginalDate = global.Date;

// Mock Date to ensure consistent testing
const mockDate = (dayOfWeek: number = 3) => { // Default to Wednesday (3)
  // Create the specific date we want for each day
  const baseDates: { [key: number]: string } = {
    0: '2024-01-14', // Sunday
    1: '2024-01-15', // Monday  
    2: '2024-01-16', // Tuesday
    3: '2024-01-17', // Wednesday
    4: '2024-01-18', // Thursday
    5: '2024-01-19', // Friday
    6: '2024-01-20', // Saturday
  };
  
  const targetDateString = baseDates[dayOfWeek];
  
  // Mock the Date constructor
  global.Date = jest.fn(((...args: any[]) => {
    if (args.length === 0) {
      return new OriginalDate(targetDateString + 'T12:00:00.000Z');
    }
    return new OriginalDate(...args);
  }) as any) as any;
  
  // Copy static methods from original Date
  global.Date.now = OriginalDate.now;
  global.Date.parse = OriginalDate.parse;
  global.Date.UTC = OriginalDate.UTC;
};

const restoreDate = () => {
  global.Date = OriginalDate;
};

// Helper to create hours data
const createHoursData = (intervals: Array<{
  day: number;
  start: string;
  end: string;
}>) => {
  return {
    hours_type: 'REGULAR',
    open: intervals.map(interval => ({
      day: interval.day,
      start: interval.start,
      end: interval.end,
      is_overnight: false
    }))
  };
};

describe('formatTodayHours', () => {
  afterEach(() => {
    restoreDate();
  });

  describe('no hours data', () => {
    it('should return null when no hours provided', () => {
      mockDate(3); // Wednesday
      expect(formatTodayHours(null)).toBeNull();
      expect(formatTodayHours(undefined)).toBeNull();
    });

    it('should return null when hours has no open array', () => {
      mockDate(3); // Wednesday
      expect(formatTodayHours({})).toBeNull();
      expect(formatTodayHours({ open: null })).toBeNull();
      expect(formatTodayHours({ open: [] })).toBeNull();
    });
  });

  describe('day mapping conversion', () => {
    it('should correctly map JavaScript Sunday (0) to Yelp Sunday (6)', () => {
      mockDate(0); // Sunday
      const hours = createHoursData([
        { day: 6, start: '1000', end: '1600' } // Yelp Sunday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('10:00 AM – 4:00 PM');
    });

    it('should correctly map JavaScript Monday (1) to Yelp Monday (0)', () => {
      mockDate(1); // Monday
      const hours = createHoursData([
        { day: 0, start: '0900', end: '1700' } // Yelp Monday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('9:00 AM – 5:00 PM');
    });

    it('should correctly map JavaScript Tuesday (2) to Yelp Tuesday (1)', () => {
      mockDate(2); // Tuesday
      const hours = createHoursData([
        { day: 1, start: '0800', end: '1800' } // Yelp Tuesday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('8:00 AM – 6:00 PM');
    });

    it('should correctly map JavaScript Wednesday (3) to Yelp Wednesday (2)', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([
        { day: 2, start: '1130', end: '1430' } // Yelp Wednesday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('11:30 AM – 2:30 PM');
    });

    it('should correctly map JavaScript Thursday (4) to Yelp Thursday (3)', () => {
      mockDate(4); // Thursday
      const hours = createHoursData([
        { day: 3, start: '0700', end: '2100' } // Yelp Thursday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('7:00 AM – 9:00 PM');
    });

    it('should correctly map JavaScript Friday (5) to Yelp Friday (4)', () => {
      mockDate(5); // Friday
      const hours = createHoursData([
        { day: 4, start: '1200', end: '2359' } // Yelp Friday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('12:00 PM – 11:59 PM');
    });

    it('should correctly map JavaScript Saturday (6) to Yelp Saturday (5)', () => {
      mockDate(6); // Saturday
      const hours = createHoursData([
        { day: 5, start: '0000', end: '1200' } // Yelp Saturday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('12:00 AM – 12:00 PM');
    });
  });

  describe('closed today', () => {
    it('should return null when no intervals for current day', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      // Only provide hours for Monday (Yelp day 0)
      const hours = createHoursData([
        { day: 0, start: '0800', end: '1700' }
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBeNull();
    });

    it('should return null when intervals exist for other days but not today', () => {
      mockDate(2); // Tuesday (Yelp day 1)
      const hours = createHoursData([
        { day: 0, start: '0800', end: '1700' }, // Monday
        { day: 2, start: '0800', end: '1700' }, // Wednesday
        { day: 4, start: '0800', end: '1700' }  // Friday
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBeNull();
    });
  });

  describe('single interval', () => {
    it('should format single interval correctly', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '0800', end: '1700' }
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('8:00 AM – 5:00 PM');
    });

    it('should handle different time formats', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '1130', end: '1430' }
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('11:30 AM – 2:30 PM');
    });

    it('should handle midnight times', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '0000', end: '2359' }
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('12:00 AM – 11:59 PM');
    });
  });

  describe('multiple intervals', () => {
    it('should join multiple intervals with comma', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '0800', end: '1130' },
        { day: 2, start: '1300', end: '1700' }
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('8:00 AM – 11:30 AM, 1:00 PM – 5:00 PM');
    });

    it('should handle three intervals', () => {
      mockDate(3); // Wednesday (Yelp day 2)  
      const hours = createHoursData([
        { day: 2, start: '0700', end: '1000' },
        { day: 2, start: '1200', end: '1500' },
        { day: 2, start: '1800', end: '2100' }
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('7:00 AM – 10:00 AM, 12:00 PM – 3:00 PM, 6:00 PM – 9:00 PM');
    });

    it('should handle intervals that span across different AM/PM periods', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '1100', end: '1300' }, // 11 AM - 1 PM
        { day: 2, start: '1700', end: '2300' }  // 5 PM - 11 PM
      ]);
      
      const result = formatTodayHours(hours);
      expect(result).toBe('11:00 AM – 1:00 PM, 5:00 PM – 11:00 PM');
    });
  });
});

describe('getHoursFallback', () => {
  it('should return "Open now" when is_open_now is true', () => {
    const hours = { is_open_now: true };
    const result = getHoursFallback(hours);
    expect(result).toBe('Open now');
  });

  it('should return "Hours unavailable" when is_open_now is false', () => {
    const hours = { is_open_now: false };
    const result = getHoursFallback(hours);
    expect(result).toBe('Hours unavailable');
  });

  it('should return "Hours unavailable" when is_open_now is undefined', () => {
    const hours = {};
    const result = getHoursFallback(hours);
    expect(result).toBe('Hours unavailable');
  });

  it('should return "Hours unavailable" when hours is null', () => {
    const result = getHoursFallback(null);
    expect(result).toBe('Hours unavailable');
  });

  it('should return "Hours unavailable" when hours is undefined', () => {
    const result = getHoursFallback(undefined);
    expect(result).toBe('Hours unavailable');
  });
});

describe('getTodayHours', () => {
  afterEach(() => {
    restoreDate();
  });

  it('should return formatted today hours when available', () => {
    mockDate(3); // Wednesday (Yelp day 2)
    const hours = createHoursData([
      { day: 2, start: '0900', end: '1700' }
    ]);
    
    const result = getTodayHours(hours);
    expect(result).toBe('Today: 9:00 AM – 5:00 PM');
  });

  it('should return fallback when no hours available but is_open_now is true', () => {
    const hours = { is_open_now: true };
    const result = getTodayHours(hours);
    expect(result).toBe('Today: Open now');
  });

  it('should return fallback when no hours available and is_open_now is false', () => {
    const hours = { is_open_now: false };
    const result = getTodayHours(hours);
    expect(result).toBe('Today: Hours unavailable');
  });

  it('should return fallback when hours is null', () => {
    const result = getTodayHours(null);
    expect(result).toBe('Today: Hours unavailable');
  });

  it('should return fallback when hours is undefined', () => {
    const result = getTodayHours(undefined);
    expect(result).toBe('Today: Hours unavailable');
  });

  it('should handle complex multiple intervals with fallback', () => {
    mockDate(3); // Wednesday (Yelp day 2)
    const hours = createHoursData([
      { day: 2, start: '0800', end: '1200' },
      { day: 2, start: '1400', end: '1800' }
    ]);
    
    const result = getTodayHours(hours);
    expect(result).toBe('Today: 8:00 AM – 12:00 PM, 2:00 PM – 6:00 PM');
  });

  it('should use fallback when closed today but is_open_now is true', () => {
    mockDate(3); // Wednesday (Yelp day 2)
    const hours = {
      is_open_now: true,
      open: [
        { day: 0, start: '0900', end: '1700' } // Only Monday hours
      ]
    };
    
    const result = getTodayHours(hours);
    expect(result).toBe('Today: Open now');
  });
});