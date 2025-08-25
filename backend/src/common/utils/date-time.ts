import { format, formatInTimeZone, toDate, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { addMinutes, isBefore, isAfter, differenceInMinutes, parseISO } from 'date-fns';

type TimeZone = string;

/**
 * Format a date to a specific timezone and format
 */
export const formatInUserTimezone = (
  date: Date | string | number,
  timeZone: TimeZone,
  formatString: string = 'PPpp zzz'
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return formatInTimeZone(dateObj, timeZone, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Convert a date from one timezone to another
 */
export const convertTimeZone = (
  date: Date | string | number,
  fromTimeZone: TimeZone,
  toTimeZone: TimeZone,
  formatString: string = 'PPpp zzz'
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const zonedDate = utcToZonedTime(dateObj, fromTimeZone);
    return formatInTimeZone(zonedDate, toTimeZone, formatString);
  } catch (error) {
    console.error('Error converting timezone:', error);
    return 'Invalid date';
  }
};

/**
 * Check if a time slot is available considering timezone differences
 */
export const isTimeSlotAvailable = ({
  startTime,
  endTime,
  timeZone,
  busySlots,
  bufferMinutes = 0,
}: {
  startTime: Date | string;
  endTime: Date | string;
  timeZone: TimeZone;
  busySlots: Array<{ start: Date | string; end: Date | string }>;
  bufferMinutes?: number;
}): boolean => {
  try {
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
    
    // Add buffer to the time slot
    const bufferedStart = addMinutes(start, -bufferMinutes);
    const bufferedEnd = addMinutes(end, bufferMinutes);
    
    // Check for overlaps with busy slots
    for (const busySlot of busySlots) {
      const busyStart = typeof busySlot.start === 'string' ? parseISO(busySlot.start) : busySlot.start;
      const busyEnd = typeof busySlot.end === 'string' ? parseISO(busySlot.end) : busySlot.end;
      
      if (
        (isAfter(bufferedStart, busyStart) && isBefore(bufferedStart, busyEnd)) ||
        (isAfter(bufferedEnd, busyStart) && isBefore(bufferedEnd, busyEnd)) ||
        (isBefore(bufferedStart, busyStart) && isAfter(bufferedEnd, busyEnd))
      ) {
        return false; // Overlapping with a busy slot
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return false;
  }
};

/**
 * Calculate the duration between two dates in minutes
 */
export const calculateDuration = (start: Date | string, end: Date | string): number => {
  try {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;
    return differenceInMinutes(endDate, startDate);
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

/**
 * Get the current time in a specific timezone
 */
export const getCurrentTimeInTimezone = (timeZone: TimeZone): Date => {
  return utcToZonedTime(new Date(), timeZone);
};

/**
 * Convert a local time to UTC
 */
export const localToUTC = (localTime: Date | string, timeZone: TimeZone): Date => {
  const date = typeof localTime === 'string' ? parseISO(localTime) : localTime;
  return zonedTimeToUtc(date, timeZone);
};

/**
 * Convert UTC to local time
 */
export const utcToLocal = (utcTime: Date | string, timeZone: TimeZone): Date => {
  const date = typeof utcTime === 'string' ? parseISO(utcTime) : utcTime;
  return utcToZonedTime(date, timeZone);
};

/**
 * Format a date range with timezone support
 */
export const formatDateRange = (
  start: Date | string,
  end: Date | string,
  timeZone: TimeZone,
  options: {
    dateFormat?: string;
    timeFormat?: string;
    separator?: string;
  } = {}
): string => {
  const {
    dateFormat = 'PPP',
    timeFormat = 'p',
    separator = ' - ',
  } = options;

  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  const startFormatted = formatInTimeZone(startDate, timeZone, `${dateFormat} 'at' ${timeFormat} (zzz)`);
  const endFormatted = formatInTimeZone(endDate, timeZone, timeFormat);
  
  return `${startFormatted}${separator}${endFormatted}`;
};

/**
 * Get the user's current timezone
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not determine timezone, defaulting to UTC');
    return 'UTC';
  }
};
