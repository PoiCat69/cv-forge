import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State persisted to localStorage, debounced on write to avoid thrashing
 * while the user types.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // storage full / unavailable — fail silently, in-memory still works
      }
    }, 400);
    return () => window.clearTimeout(timer.current);
  }, [key, value]);

  const reset = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initial);
  }, [key, initial]);

  return [value, setValue, reset] as const;
}
