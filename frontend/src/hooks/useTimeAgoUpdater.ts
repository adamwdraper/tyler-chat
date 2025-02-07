import { useEffect, useRef } from 'react';

// This hook manages periodic updates for time-ago timestamps
export const useTimeAgoUpdater = (onUpdate: () => void) => {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Update every minute
    intervalRef.current = setInterval(() => {
      onUpdate();
    }, 60000); // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onUpdate]);
}; 