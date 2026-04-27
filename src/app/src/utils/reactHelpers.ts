/**
 * React Helpers - Utilities to prevent common bugs and glitches
 * These helpers ensure stable, smooth operation without affecting animations
 */

import { useEffect, useRef, useCallback, DependencyList } from 'react';

/**
 * Safe setState that only updates if component is still mounted
 * Prevents "Can't perform a React state update on an unmounted component" warnings
 */
export function useSafeState<T>(
  setState: React.Dispatch<React.SetStateAction<T>>
): React.Dispatch<React.SetStateAction<T>> {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback((value: React.SetStateAction<T>) => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, [setState]);
}

/**
 * Debounced resize listener to prevent excessive re-renders
 * Use this instead of direct window.addEventListener('resize')
 */
export function useDebounceResize(callback: () => void, delay: number = 150) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current();
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    
    // Call immediately on mount
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);
}

/**
 * Safe interval that cleans up automatically and checks if mounted
 */
export function useSafeInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      if (isMountedRef.current) {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Safe timeout that cleans up automatically
 */
export function useSafeTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      if (isMountedRef.current) {
        savedCallback.current();
      }
    };

    timeoutRef.current = setTimeout(tick, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);
}

/**
 * Throttled event listener - prevents excessive calls
 * Good for scroll, mousemove, etc.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(((...args: any[]) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      // Schedule for later if not executed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  }) as T, [callback, delay]);
}

/**
 * Debounced function - delays execution until after user stops calling it
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }) as T, [delay]);
}

/**
 * Safe event listener that always cleans up
 */
export function useSafeEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: Event) => {
      if (isMountedRef.current) {
        savedHandler.current(event as WindowEventMap[K]);
      }
    };

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Async effect with proper cleanup
 * Prevents race conditions and memory leaks from async operations
 */
export function useAsyncEffect(
  effect: (isMounted: () => boolean) => Promise<void> | void,
  deps: DependencyList
) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const isMounted = () => isMountedRef.current;
    
    effect(isMounted);

    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Fetch with automatic abort on unmount
 * Prevents memory leaks from ongoing fetch requests
 */
export function useAbortableFetch() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchWithAbort = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });
      return response;
    } catch (error: any) {
      // Don't throw on abort - it's expected
      if (error.name === 'AbortError') {
        console.log(`Fetch aborted: ${url}`);
        throw error; // Still throw so caller can handle it
      }
      throw error;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { fetchWithAbort, abort };
}

/**
 * Previous value hook - useful for detecting changes
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Check if component is mounted
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Animation frame with cleanup
 * Perfect for smooth animations without memory leaks
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, running: boolean = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [running]);
}
