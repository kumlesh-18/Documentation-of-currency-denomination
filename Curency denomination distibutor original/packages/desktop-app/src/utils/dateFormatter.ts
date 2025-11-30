/**
 * Date formatting utilities
 * Handles timezone-aware datetime formatting for consistent display
 */

/**
 * Format a date string to local date and time
 * @param dateStr ISO 8601 date string from backend (UTC)
 * @returns Formatted local date and time string
 */
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

/**
 * Format a date string to relative time (e.g., "5m ago", "2h ago")
 * Falls back to date if older than 7 days
 * @param dateStr ISO 8601 date string from backend (UTC)
 * @returns Relative time string
 */
export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Format a date string to just the date (no time)
 * @param dateStr ISO 8601 date string from backend (UTC)
 * @returns Formatted local date string
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString();
};

/**
 * Format a date string to just the time (no date)
 * @param dateStr ISO 8601 date string from backend (UTC)
 * @returns Formatted local time string
 */
export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Time';
  }
  
  return date.toLocaleTimeString();
};

/**
 * Format a date string with custom options
 * @param dateStr ISO 8601 date string from backend (UTC)
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDateCustom = (
  dateStr: string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleString(undefined, options);
};
