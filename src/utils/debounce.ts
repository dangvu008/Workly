/**
 * Debounce utility functions để tối ưu hóa performance
 * Giảm số lần gọi function trong khoảng thời gian ngắn
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce cho async functions với cancel capability
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): {
  execute: (...args: Parameters<T>) => Promise<ReturnType<T> | null>;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout;
  let cancelled = false;

  const execute = (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      cancelled = false;

      timeoutId = setTimeout(async () => {
        if (!cancelled) {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            console.error('Debounced async function error:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }, delay);
    });
  };

  const cancel = () => {
    cancelled = true;
    clearTimeout(timeoutId);
  };

  return { execute, cancel };
}

/**
 * Batch multiple function calls into one
 */
export function batchCalls<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  let calls: Parameters<T>[] = [];

  return (...args: Parameters<T>) => {
    calls.push(args);
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (calls.length > 0) {
        // Execute with the latest arguments
        const latestArgs = calls[calls.length - 1];
        func(...latestArgs);
        calls = [];
      }
    }, delay);
  };
}

/**
 * Rate limiter để giới hạn số lần gọi function trong một khoảng thời gian
 */
export function rateLimit<T extends (...args: any[]) => any>(
  func: T,
  maxCalls: number,
  timeWindow: number
): (...args: Parameters<T>) => boolean {
  const calls: number[] = [];

  return (...args: Parameters<T>): boolean => {
    const now = Date.now();
    
    // Remove calls outside the time window
    while (calls.length > 0 && calls[0] <= now - timeWindow) {
      calls.shift();
    }

    // Check if we can make another call
    if (calls.length < maxCalls) {
      calls.push(now);
      func(...args);
      return true;
    }

    return false; // Rate limit exceeded
  };
}
