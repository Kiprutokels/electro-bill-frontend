import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (
  date: string | Date,
  formatString: string = 'MMM dd, yyyy'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString) : 'Invalid Date';
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (
  date: string | Date,
  formatString: string = 'MMM dd, yyyy HH:mm'
): string => {
  return formatDate(date, formatString);
};

export const getRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateObj);
  } catch (error) {
    return 'Invalid Date';
  }
};

export const isToday = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};
