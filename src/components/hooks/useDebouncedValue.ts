/**
 * Custom hook for debouncing a value
 * Used for search input to reduce API calls
 */
import { useState, useEffect } from "react";

/**
 * Debounce a value by delaying its update
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebouncedValue(searchInput, 300);
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
