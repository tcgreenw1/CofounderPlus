import { format, parse, addMinutes } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

// Common timezones for the dropdown
export const POPULAR_TIMEZONES = [
  'America/Los_Angeles', // PT
  'America/Denver',      // MT
  'America/Chicago',     // CT
  'America/New_York',    // ET
  'Europe/London',       // GMT/BST
  'Europe/Paris',        // CET
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC'
];

export const ADMIN_TIMEZONE = 'America/Chicago';

/**
 * Get the user's local timezone
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return 'America/Chicago';
  }
};

/**
 * Convert an Admin (CST) slot to User's timezone
 */
export const convertSlotToUserTime = (
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // "9:00 AM"
  targetTimezone: string
): { date: string; time: string; fullDate: Date } => {
  // 1. Parse the Admin date/time as if it were in the Admin Timezone
  // Format: YYYY-MM-DD h:mm a
  const dateTimeStr = `${dateStr} ${timeStr}`;
  const formatStr = 'yyyy-MM-dd h:mm a';
  
  // We need to construct a Date object that represents this specific time in America/Chicago
  // Since we can't easily "set" a timezone on a native Date object without shifting it,
  // we use a helper to get the timestamp.
  
  // Create a date object that "looks" like the time, then treat it as UTC to get components, 
  // then construct the actual zoned time? No, date-fns-tz `zonedTimeToUtc` is best.
  
  // "2023-10-27 09:00 AM" in 'America/Chicago' -> UTC Timestamp
  // Note: date-fns `parse` returns a local Date. We need to be careful.
  
  // Workaround: Create ISO string with offset? No, offset changes with DST.
  // Best way with date-fns-tz:
  const parsedLocal = parse(dateTimeStr, formatStr, new Date());
  
  // Get the ISO string component YYYY-MM-DDTHH:mm:00
  const isoDate = format(parsedLocal, "yyyy-MM-dd'T'HH:mm:00");
  
  // Now get the equivalent UTC date for this "wall time" in Admin Zone
  // This function takes a string/date and a timezone, and returns the Date (UTC) that corresponds to it.
  // We need to import `zonedTimeToUtc` dynamically or implement a simple version if we don't want heavy imports?
  // Let's assume we can use standard Intl if we want to be lightweight, but date-fns-tz is robust.
  
  // For the frontend, we'll try to use native Intl if possible to avoid big bundles, 
  // but date-fns-tz is standard in this stack.
  
  return { date: dateStr, time: timeStr, fullDate: new Date() }; // Placeholder, will implement logic in component
};
