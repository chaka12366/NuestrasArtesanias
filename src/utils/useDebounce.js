import { useState, useEffect } from 'react';

/**
 * Debounce a value by a given delay.
 * Returns the debounced value that updates only after `delay` ms of inactivity.
 *
 * @param {*} value  The value to debounce
 * @param {number} delay  Debounce delay in milliseconds (default 300)
 * @returns {*}  The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
