import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: Error | string | null;
  data: any;
}

export interface LoadingStateOptions {
  initialLoading?: boolean;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useLoadingState = (options: LoadingStateOptions = {}) => {
  const {
    initialLoading = false,
    timeout = 30000, // 30 seconds default timeout
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    data: null,
  });

  const [attemptCount, setAttemptCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
    setAttemptCount(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const executeWithLoading = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    options?: { skipLoading?: boolean; skipErrorReset?: boolean }
  ): Promise<T | null> => {
    const { skipLoading = false, skipErrorReset = false } = options || {};

    try {
      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController();
      
      if (!skipLoading) {
        setLoading(true);
      }
      
      if (!skipErrorReset) {
        setState(prev => ({ ...prev, error: null }));
      }

      // Set up timeout
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          setError(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      }

      // Execute the operation
      const result = await operation(abortControllerRef.current.signal);
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setData(result);
      setAttemptCount(0); // Reset attempt count on success
      return result;

    } catch (error) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Don't set error if operation was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
      return null;
    }
  }, [timeout, setLoading, setError, setData]);

  const retry = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    if (attemptCount >= retryAttempts) {
      setError(new Error(`Maximum retry attempts (${retryAttempts}) exceeded`));
      return null;
    }

    setAttemptCount(prev => prev + 1);

    // Wait for retry delay
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attemptCount));
    }

    return executeWithLoading(operation);
  }, [attemptCount, retryAttempts, retryDelay, executeWithLoading]);

  return {
    ...state,
    attemptCount,
    maxAttempts: retryAttempts,
    canRetry: attemptCount < retryAttempts,
    setLoading,
    setError,
    setData,
    reset,
    executeWithLoading,
    retry,
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const setLoadingState = useCallback((key: string, state: Partial<LoadingState>) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...state },
    }));
  }, []);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingState(key, { isLoading: loading });
  }, [setLoadingState]);

  const setError = useCallback((key: string, error: Error | string | null) => {
    setLoadingState(key, { error, isLoading: false });
  }, [setLoadingState]);

  const setData = useCallback((key: string, data: any) => {
    setLoadingState(key, { data, error: null, isLoading: false });
  }, [setLoadingState]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates(prev => ({
        ...prev,
        [key]: { isLoading: false, error: null, data: null },
      }));
    } else {
      setStates({});
    }
  }, []);

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { isLoading: false, error: null, data: null };
  }, [states]);

  const isAnyLoading = Object.values(states).some(state => state.isLoading);
  const hasAnyError = Object.values(states).some(state => state.error);

  return {
    states,
    getState,
    setLoading,
    setError,
    setData,
    setLoadingState,
    reset,
    isAnyLoading,
    hasAnyError,
  };
};

// Hook for async operations with automatic loading state management
export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: LoadingStateOptions = {}
) => {
  const loadingState = useLoadingState(options);

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    return loadingState.executeWithLoading(() => operation(...args));
  }, [operation, loadingState]);

  const retry = useCallback(async (...args: T): Promise<R | null> => {
    return loadingState.retry(() => operation(...args));
  }, [operation, loadingState]);

  return {
    ...loadingState,
    execute,
    retry,
  };
};