import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  
  const distance = formatDistanceToNowStrict(parseISO(dateString));
  
  // If it's "0 seconds", return "just now"
  if (distance === '0 seconds') return 'just now';
  
  // Extract number and unit from the distance string
  const [number, unit] = distance.split(' ');
  
  // Get the first letter of the unit (s for seconds, m for minutes, etc)
  const unitAbbrev = unit.charAt(0);
  
  return `${number}${unitAbbrev}`;
}; 