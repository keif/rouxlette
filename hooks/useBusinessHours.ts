import { useMemo } from 'react';
import { YelpBusiness } from '../types/yelp';

// Use the more detailed types from useResults
interface HoursProps {
  hours_type: string;
  is_open_now: boolean;
  open: OpenProps[];
}

interface OpenProps {
  day: number;
  end: string;
  is_overnight: boolean;
  start: string;
}

interface BusinessHoursResult {
  todayLabel: string;
  isOpen: boolean | undefined;
  weekly?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Helper to format time from "HHmm" string to locale time
const formatTime = (timeStr: string): string => {
  if (!timeStr || timeStr.length !== 4) return timeStr;
  
  const hours = parseInt(timeStr.substring(0, 2), 10);
  const minutes = parseInt(timeStr.substring(2, 4), 10);
  
  // Use a specific date for time formatting to avoid interference with date mocking
  const date = new Date(2024, 0, 1); // January 1, 2024
  date.setHours(hours, minutes, 0, 0);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper to format a time range
const formatTimeRange = (start: string, end: string): string => {
  return `${formatTime(start)}–${formatTime(end)}`;
};

// Convert JS getDay() (0=Sunday...6=Saturday) to Yelp day index (0=Monday...6=Sunday)
const getYelpDayIndex = (jsDay: number): number => {
  return (jsDay + 6) % 7;
};

// Get intervals for a specific day from hours data
const getIntervalsForDay = (hours: HoursProps[], day: number): OpenProps[] => {
  if (!hours || hours.length === 0) return [];
  
  const hoursData = hours[0]; // Typically there's only one hours object
  if (!hoursData.open) return [];
  
  return hoursData.open.filter(interval => interval.day === day);
};

// Process overnight interval for today's label (only show today's portion)
const processTodayOvernight = (interval: OpenProps, isToday: boolean): string | null => {
  if (!interval.is_overnight) {
    return formatTimeRange(interval.start, interval.end);
  }
  
  if (isToday) {
    // For today, show start to 23:59 (end of day)
    return formatTimeRange(interval.start, '2359');
  } else {
    // For next day portion of overnight interval, show 00:00 to end
    return formatTimeRange('0000', interval.end);
  }
};

// Process overnight interval for weekly display (show full range)
const processWeeklyOvernight = (interval: OpenProps): string => {
  if (!interval.is_overnight) {
    return formatTimeRange(interval.start, interval.end);
  }
  
  // For weekly view, show the full overnight range
  return formatTimeRange(interval.start, interval.end);
};

export default function useBusinessHours(hours?: YelpBusiness['hours']): BusinessHoursResult {
  return useMemo(() => {
    // No hours data
    if (!hours || hours.length === 0) {
      return {
        todayLabel: 'Hours unavailable',
        isOpen: undefined,
        weekly: undefined
      };
    }

    const hoursData = hours[0] as HoursProps; // Cast since YelpBusiness uses any[]
    const now = new Date();
    const todayJsDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
    const todayYelpDay = getYelpDayIndex(todayJsDay);
    
    // Get today's intervals
    const todayIntervals = getIntervalsForDay([hoursData], todayYelpDay);
    
    // Check for yesterday's overnight intervals that extend into today
    const yesterdayYelpDay = (todayYelpDay + 6) % 7; // Previous day in Yelp indexing
    const yesterdayIntervals = getIntervalsForDay([hoursData], yesterdayYelpDay);
    const overnightFromYesterday = yesterdayIntervals.filter(interval => interval.is_overnight);
    
    // Build today's label
    const todaySegments: string[] = [];
    
    // Add overnight segments from yesterday (00:00 to end time)
    overnightFromYesterday.forEach(interval => {
      const segment = processTodayOvernight(interval, false);
      if (segment) todaySegments.push(segment);
    });
    
    // Add today's regular intervals and overnight starts
    todayIntervals.forEach(interval => {
      const segment = processTodayOvernight(interval, true);
      if (segment) todaySegments.push(segment);
    });
    
    const todayLabel = todaySegments.length > 0 
      ? todaySegments.join(', ')
      : 'Closed today';
    
    // Determine isOpen status
    let isOpen: boolean | undefined;
    if (hoursData.is_open_now !== undefined) {
      isOpen = hoursData.is_open_now;
    } else if (todaySegments.length === 0) {
      // Day has no intervals => isOpen defaults to false
      isOpen = false;
    } else {
      // Has intervals but is_open_now not provided => undefined  
      isOpen = undefined;
    }
    
    // Build weekly schedule
    const weeklyLines: string[] = [];
    for (let yelpDay = 0; yelpDay < 7; yelpDay++) {
      const dayIntervals = getIntervalsForDay([hoursData], yelpDay);
      const dayName = DAYS[yelpDay];
      
      if (dayIntervals.length === 0) {
        weeklyLines.push(`${dayName}: Closed`);
      } else {
        const ranges = dayIntervals.map(interval => processWeeklyOvernight(interval));
        weeklyLines.push(`${dayName}: ${ranges.join(', ')}`);
      }
    }
    
    const weekly = weeklyLines.join('\n');
    
    return {
      todayLabel,
      isOpen,
      weekly
    };
  }, [hours]);
}