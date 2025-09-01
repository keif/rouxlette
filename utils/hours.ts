/**
 * Formats today's business hours from Yelp hours data
 * Handles the Yelp Monday=0 vs JavaScript Sunday=0 discrepancy
 * 
 * @param hours - Yelp hours object with open[] array
 * @returns Formatted hours string or null if not available
 */
export function formatTodayHours(hours: any): string | null {
  if (!hours?.open?.length) {
    return null;
  }

  const todayLocal = new Date();
  // Convert JavaScript weekday (Sunday=0) to Yelp weekday (Monday=0)
  const yelpDay = (todayLocal.getDay() + 6) % 7;
  
  // Find all time slots for today
  const slots = hours.open.filter((slot: any) => slot.day === yelpDay);
  
  if (!slots.length) {
    return null;
  }

  // Format time helper function
  const formatTime = (hhmm: string): string => {
    const hour = parseInt(hhmm.slice(0, 2), 10);
    const minute = hhmm.slice(2);
    const date = new Date(2000, 0, 1, hour, parseInt(minute, 10));
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Format each time slot and join with commas
  const formattedSlots = slots.map((slot: any) => 
    `${formatTime(slot.start)} – ${formatTime(slot.end)}`
  );

  return formattedSlots.join(', ');
}

/**
 * Get a fallback hours string when detailed hours aren't available
 * 
 * @param hours - Yelp hours object
 * @returns Fallback string based on is_open_now status
 */
export function getHoursFallback(hours: any): string {
  if (hours?.is_open_now === true) {
    return 'Open now';
  }
  return 'Hours unavailable';
}

/**
 * Get today's hours with fallback handling
 * 
 * @param hours - Yelp hours object (can be undefined)
 * @returns Formatted string for display
 */
export function getTodayHours(hours: any): string {
  const todayHours = formatTodayHours(hours);
  
  if (todayHours) {
    return `Today: ${todayHours}`;
  }
  
  const fallback = getHoursFallback(hours);
  return `Today: ${fallback}`;
}