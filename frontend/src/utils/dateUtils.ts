import { formatDistanceToNowStrict, isToday, format } from 'date-fns';

export const formatTimestamp = (timestamp: string, shortFormat: boolean = true): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // For very recent messages (less than a minute)
  if (diffInSeconds < 60) {
    return 'now';
  }

  // For messages within the last hour, show minutes
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  }

  // For today's messages, show hours
  if (isToday(date)) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  }

  // For older messages, show the date
  return shortFormat ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}; 