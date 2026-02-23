/**
 * UTC-3 Timezone Utilities
 * All date and time operations in the application use UTC-3 timezone
 * 
 * Important: UTC-3 means 3 hours behind UTC.
 * When it's midnight (00:00) in UTC-3, it's 03:00 in UTC.
 */

/**
 * Get current date in UTC-3 as a Date object
 * This returns the current moment adjusted to UTC-3 timezone
 */
export function getCurrentDateUTC3(): Date {
  const now = new Date();
  // Get UTC time in milliseconds
  const utcTime = now.getTime();
  // Subtract 3 hours (10800000 ms) to get UTC-3
  const utc3Time = utcTime - (3 * 3600000);
  return new Date(utc3Time);
}

/**
 * Convert a timestamp (seconds since epoch) to a Date object
 * The timestamp from backend is already in UTC-3 context
 */
export function timestampToDateUTC3(timestamp: bigint | number): Date {
  const seconds = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const milliseconds = seconds * 1000;
  // The timestamp represents seconds since epoch, interpreted as UTC-3 midnight
  // We need to add 3 hours to convert to UTC for proper Date object creation
  return new Date(milliseconds + (3 * 3600000));
}

/**
 * Format a timestamp as a date string in Spanish (UTC-3)
 */
export function formatDateUTC3(timestamp: bigint | number): string {
  const date = timestampToDateUTC3(timestamp);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Get current date display string in UTC-3
 */
export function getCurrentDateDisplayUTC3(): string {
  const now = new Date();
  // Calculate UTC-3 time
  const utc3Time = new Date(now.getTime() - (3 * 3600000));
  
  // Format using UTC methods to avoid timezone issues
  const year = utc3Time.getUTCFullYear();
  const month = utc3Time.getUTCMonth();
  const day = utc3Time.getUTCDate();
  
  const date = new Date(Date.UTC(year, month, day));
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Convert a date string (YYYY-MM-DD) to timestamp at midnight UTC-3
 * Returns seconds since epoch representing midnight in UTC-3
 */
export function dateStringToTimestampUTC3(dateString: string): bigint {
  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a date at midnight UTC-3
  // Midnight in UTC-3 is 03:00 in UTC
  const date = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
  
  // Return timestamp in seconds, but subtract 3 hours to represent UTC-3 midnight
  return BigInt(Math.floor(date.getTime() / 1000) - 10800);
}

/**
 * Get today's date in YYYY-MM-DD format (UTC-3)
 */
export function getTodayDateStringUTC3(): string {
  const now = new Date();
  // Calculate UTC-3 time
  const utc3Time = new Date(now.getTime() - (3 * 3600000));
  
  // Use UTC methods to extract date components
  const year = utc3Time.getUTCFullYear();
  const month = String(utc3Time.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc3Time.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a timestamp is within a date range (UTC-3)
 */
export function isTimestampInDateRangeUTC3(
  timestamp: bigint,
  startDate: string,
  endDate: string
): boolean {
  const timestampNum = Number(timestamp);
  const startTimestamp = Number(dateStringToTimestampUTC3(startDate));
  const endTimestamp = Number(dateStringToTimestampUTC3(endDate)) + 86399; // End of day
  return timestampNum >= startTimestamp && timestampNum <= endTimestamp;
}

/**
 * Check if a timestamp matches a specific date (UTC-3)
 */
export function isTimestampOnDateUTC3(timestamp: bigint, dateString: string): boolean {
  const timestampNum = Number(timestamp);
  const startTimestamp = Number(dateStringToTimestampUTC3(dateString));
  const endTimestamp = startTimestamp + 86399; // End of day
  return timestampNum >= startTimestamp && timestampNum <= endTimestamp;
}

/**
 * Convert timestamp to Date object for date input (UTC-3)
 */
export function timestampToDateInputUTC3(timestamp: bigint | number): Date {
  const date = timestampToDateUTC3(timestamp);
  return date;
}
