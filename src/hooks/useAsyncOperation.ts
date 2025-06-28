import React, { useState, useCallback, useRef } from 'react';

interface AsyncOperationState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showErrorAlert?: boolean;
}

/**
 * Custom hook để quản lý async operations với loading, error states
 * Cải thiện UX bằng cách cung cấp consistent loading và error handling
 */
export function useAsyncOperation<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Cancel previous operation if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await asyncFunction(...args);

        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        setState({
          isLoading: false,
          error: null,
          data: result,
        });

        options.onSuccess?.(result);
        return result;
      } catch (error) {
        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));

        setState({
          isLoading: false,
          error: errorObj,
          data: null,
        });

        options.onError?.(errorObj);

        if (options.showErrorAlert) {
          // Import Alert dynamically to avoid circular dependencies
          import('react-native').then(({ Alert }) => {
            Alert.alert(
              'Lỗi',
              errorObj.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
              [{ text: 'OK' }]
            );
          });
        }

        throw errorObj;
      }
    },
    [asyncFunction, options]
  );

  const reset = useCallback(() => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      isLoading: false,
      error: null,
      data: null,
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
  };
}

/**
 * Hook đơn giản hóa cho các operations không cần return data
 */
export function useAsyncAction(
  asyncFunction: (...args: any[]) => Promise<void>,
  options: UseAsyncOperationOptions = {}
) {
  const { execute, isLoading, error, reset, cancel } = useAsyncOperation(
    asyncFunction,
    options
  );

  return {
    execute,
    isLoading,
    error,
    reset,
    cancel,
  };
}

/**
 * Hook cho việc fetch data với auto-retry
 */
export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  options: UseAsyncOperationOptions & {
    autoExecute?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
) {
  const {
    autoExecute = false,
    retryCount = 0,
    retryDelay = 1000,
    ...asyncOptions
  } = options;

  const [retryAttempt, setRetryAttempt] = useState(0);

  const { execute: originalExecute, ...rest } = useAsyncOperation(
    fetchFunction,
    asyncOptions
  );

  const executeWithRetry = useCallback(async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        setRetryAttempt(attempt);
        return await originalExecute();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retryCount) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  }, [originalExecute, retryCount, retryDelay]);

  // Auto-execute on mount if enabled
  React.useEffect(() => {
    if (autoExecute) {
      executeWithRetry();
    }
  }, [autoExecute]); // Remove executeWithRetry from deps to avoid infinite loop

  return {
    ...rest,
    execute: executeWithRetry,
    retryAttempt,
  };
}
