import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'error';

/**
 * State persisted to localStorage, debounced on write to avoid thrashing
 * while the user types, with save status and error tracking.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValueState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const isInitialMount = useRef(true);

  const setValue = useCallback((updater: T | ((prev: T) => T)) => {
    setSaveStatus('saving');
    setValueState(updater);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setSaveStatus('saved');
        setErrorMessage(null);
      } catch (err) {
        setSaveStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Penyimpanan lokal penuh atau tidak diizinkan.'
        );
      }
    }, 400);

    return () => window.clearTimeout(timer.current);
  }, [key, value]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setValueState(initial);
    setSaveStatus('saved');
    setErrorMessage(null);
  }, [key, initial]);

  return [value, setValue, { reset, saveStatus, errorMessage }] as const;
}
