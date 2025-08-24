import { renderHook } from '@testing-library/react-native';
import useBusinessHours from '../../hooks/useBusinessHours';

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
  is_overnight?: boolean;
}>, is_open_now?: boolean) => {
  const hoursData: any = {
    hours_type: 'REGULAR',
    open: intervals.map(interval => ({
      day: interval.day,
      start: interval.start,
      end: interval.end,
      is_overnight: interval.is_overnight ?? false
    }))
  };
  
  // Only add is_open_now if it's explicitly provided
  if (is_open_now !== undefined) {
    hoursData.is_open_now = is_open_now;
  }
  
  return [hoursData];
};

describe('useBusinessHours', () => {
  afterEach(() => {
    restoreDate();
  });

  describe('no hours data', () => {
    it('should return hours unavailable when no hours provided', () => {
      mockDate(3); // Wednesday
      const { result } = renderHook(() => useBusinessHours());
      
      expect(result.current.todayLabel).toBe('Hours unavailable');
      expect(result.current.isOpen).toBeUndefined();
      expect(result.current.weekly).toBeUndefined();
    });

    it('should return hours unavailable when hours is empty array', () => {
      mockDate(3); // Wednesday
      const { result } = renderHook(() => useBusinessHours([]));
      
      expect(result.current.todayLabel).toBe('Hours unavailable');
      expect(result.current.isOpen).toBeUndefined();
      expect(result.current.weekly).toBeUndefined();
    });
  });

  describe('closed today', () => {
    it('should return closed today when no intervals for current day', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      // Only provide hours for Monday (Yelp day 0)
      const hours = createHoursData([
        { day: 0, start: '0800', end: '1700' }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('Closed today');
      expect(result.current.isOpen).toBe(false);
    });

    it('should reflect is_open_now status when provided', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([], true); // No intervals but marked as open
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('Closed today');
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('single interval', () => {
    it('should format single interval correctly', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '0800', end: '1700' }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('8:00 AM–5:00 PM');
    });

    it('should handle different time formats', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '1130', end: '1430' }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('11:30 AM–2:30 PM');
    });
  });

  describe('multiple intervals', () => {
    it('should join multiple intervals with comma', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '0800', end: '1130' },
        { day: 2, start: '1300', end: '1700' }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('8:00 AM–11:30 AM, 1:00 PM–5:00 PM');
    });

    it('should handle three intervals', () => {
      mockDate(3); // Wednesday (Yelp day 2)  
      const hours = createHoursData([
        { day: 2, start: '0700', end: '1000' },
        { day: 2, start: '1200', end: '1500' },
        { day: 2, start: '1800', end: '2100' }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('7:00 AM–10:00 AM, 12:00 PM–3:00 PM, 6:00 PM–9:00 PM');
    });
  });

  describe('overnight intervals', () => {
    it('should show only today portion of overnight interval for todayLabel', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 2, start: '2200', end: '0200', is_overnight: true }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      // For today, should only show start to end of day (23:59)
      expect(result.current.todayLabel).toBe('10:00 PM–11:59 PM');
    });

    it('should include overnight continuation from previous day', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      // Tuesday (Yelp day 1) has overnight hours into Wednesday
      const hours = createHoursData([
        { day: 1, start: '2200', end: '0200', is_overnight: true }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      // Should show the continuation from yesterday (00:00 to 02:00)
      expect(result.current.todayLabel).toBe('12:00 AM–2:00 AM');
    });

    it('should combine overnight from yesterday and today intervals', () => {
      mockDate(3); // Wednesday (Yelp day 2)
      const hours = createHoursData([
        { day: 1, start: '2200', end: '0200', is_overnight: true }, // Tuesday night into Wednesday
        { day: 2, start: '1200', end: '1800' } // Wednesday regular hours
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('12:00 AM–2:00 AM, 12:00 PM–6:00 PM');
    });
  });

  describe('weekly schedule', () => {
    it('should include all 7 days with closed for missing days', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([
        { day: 0, start: '0900', end: '1700' }, // Monday
        { day: 2, start: '0900', end: '1700' }, // Wednesday  
        { day: 4, start: '0900', end: '1700' }  // Friday
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      const expectedWeekly = [
        'Mon: 9:00 AM–5:00 PM',
        'Tue: Closed', 
        'Wed: 9:00 AM–5:00 PM',
        'Thu: Closed',
        'Fri: 9:00 AM–5:00 PM',
        'Sat: Closed',
        'Sun: Closed'
      ].join('\n');
      
      expect(result.current.weekly).toBe(expectedWeekly);
    });

    it('should show full overnight ranges in weekly view', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([
        { day: 0, start: '0900', end: '1700' }, // Monday regular
        { day: 4, start: '2200', end: '0200', is_overnight: true } // Friday overnight
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.weekly).toContain('Mon: 9:00 AM–5:00 PM');
      expect(result.current.weekly).toContain('Fri: 10:00 PM–2:00 AM'); // Full overnight range
    });

    it('should handle multiple intervals per day in weekly', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([
        { day: 0, start: '0800', end: '1200' }, // Monday morning
        { day: 0, start: '1400', end: '1800' }  // Monday afternoon
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.weekly).toContain('Mon: 8:00 AM–12:00 PM, 2:00 PM–6:00 PM');
    });
  });

  describe('day mapping', () => {
    it('should correctly map Monday JS day (1) to Yelp Monday (0)', () => {
      mockDate(1); // Monday
      const hours = createHoursData([
        { day: 0, start: '0900', end: '1700' } // Yelp Monday
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('9:00 AM–5:00 PM');
    });

    it('should correctly map Sunday JS day (0) to Yelp Sunday (6)', () => {
      mockDate(0); // Sunday
      const hours = createHoursData([
        { day: 6, start: '1000', end: '1600' } // Yelp Sunday  
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('10:00 AM–4:00 PM');
    });

    it('should correctly map Saturday JS day (6) to Yelp Saturday (5)', () => {
      mockDate(6); // Saturday
      const hours = createHoursData([
        { day: 5, start: '1100', end: '2000' } // Yelp Saturday
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.todayLabel).toBe('11:00 AM–8:00 PM');
    });
  });

  describe('isOpen status', () => {
    it('should return is_open_now when provided', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([
        { day: 2, start: '0900', end: '1700' }
      ], true);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.isOpen).toBe(true);
    });

    it('should return undefined when is_open_now not provided', () => {
      mockDate(3); // Wednesday
      const hours = createHoursData([
        { day: 2, start: '0900', end: '1700' }
      ]);
      
      const { result } = renderHook(() => useBusinessHours(hours));
      
      expect(result.current.isOpen).toBeUndefined();
    });
  });
});