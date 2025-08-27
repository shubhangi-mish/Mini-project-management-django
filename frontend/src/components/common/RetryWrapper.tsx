import React, { useState, useCallback, useEffect } from 'react';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';

interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
}

interface RetryWrapperProps {
  children: React.ReactNode;
  onRetry: () => Promise<void> | void;
  loading?: boolean;
  error?: Error | string | null;
  retryConfig?: RetryConfig;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

export const RetryWrapper: React.FC<RetryWrapperProps> = ({
  children,
  onRetry,
  loading = false,
  error = null,
  retryConfig = {},
  loadingComponent,
  errorComponent,
  className = '',
}) => {
  const config = { ...defaultRetryConfig, ...retryConfig };
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryDelay, setRetryDelay] = useState(config.delay);

  // Reset attempt count when error changes
  useEffect(() => {
    if (!error) {
      setAttemptCount(0);
      setRetryDelay(config.delay);
    }
  }, [error, config.delay]);

  const handleRetry = useCallback(async () => {
    if (attemptCount >= config.maxAttempts) {
      return;
    }

    setIsRetrying(true);
    setAttemptCount(prev => prev + 1);

    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
      
      // Calculate next delay with exponential backoff
      const nextDelay = Math.min(
        retryDelay * config.backoffMultiplier,
        config.maxDelay
      );
      setRetryDelay(nextDelay);
    }
  }, [attemptCount, config.maxAttempts, config.backoffMultiplier, config.maxDelay, onRetry, retryDelay]);

  const handleAutoRetry = useCallback(async () => {
    if (attemptCount < config.maxAttempts && !isRetrying) {
      // Wait for the delay before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await handleRetry();
    }
  }, [attemptCount, config.maxAttempts, isRetrying, retryDelay, handleRetry]);

  // Show loading state
  if (loading || isRetrying) {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }
    
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner 
          size="md" 
          text={isRetrying ? `Retrying... (${attemptCount}/${config.maxAttempts})` : 'Loading...'} 
        />
      </div>
    );
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }

    const errorMessage = typeof error === 'string' ? error : error.message;
    const canRetry = attemptCount < config.maxAttempts;
    const isMaxAttemptsReached = attemptCount >= config.maxAttempts;

    return (
      <div className={className}>
        <ErrorMessage
          title={isMaxAttemptsReached ? 'Maximum Retry Attempts Reached' : 'Operation Failed'}
          message={
            isMaxAttemptsReached
              ? `Failed after ${config.maxAttempts} attempts: ${errorMessage}`
              : errorMessage
          }
          severity={isMaxAttemptsReached ? 'error' : 'warning'}
          onRetry={canRetry ? handleRetry : undefined}
          actions={[
            ...(canRetry ? [{
              label: 'Auto Retry',
              onClick: handleAutoRetry,
              variant: 'secondary' as const,
            }] : []),
            {
              label: 'Reset',
              onClick: () => {
                setAttemptCount(0);
                setRetryDelay(config.delay);
              },
              variant: 'secondary' as const,
            },
          ]}
          details={`Attempt ${attemptCount}/${config.maxAttempts}${
            canRetry ? ` • Next retry delay: ${retryDelay}ms` : ''
          }`}
        />
      </div>
    );
  }

  // Show success state
  return <div className={className}>{children}</div>;
};

// Hook for retry logic
export const useRetry = (
  operation: () => Promise<void> | void,
  config: RetryConfig = {}
) => {
  const retryConfig = { ...defaultRetryConfig, ...config };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await operation();
      setAttemptCount(0); // Reset on success
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Operation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [operation]);

  const retry = useCallback(async () => {
    if (attemptCount >= retryConfig.maxAttempts) {
      return;
    }

    setAttemptCount(prev => prev + 1);
    await execute();
  }, [attemptCount, retryConfig.maxAttempts, execute]);

  const reset = useCallback(() => {
    setAttemptCount(0);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    attemptCount,
    maxAttempts: retryConfig.maxAttempts,
    execute,
    retry,
    reset,
    canRetry: attemptCount < retryConfig.maxAttempts,
  };
};

// Higher-order component for retry functionality
export const withRetry = <P extends object>(
  Component: React.ComponentType<P>,
  retryConfig?: RetryConfig
) => {
  return React.forwardRef<any, P & {
    onRetry?: () => Promise<void> | void;
    loading?: boolean;
    error?: Error | string | null;
  }>((props, ref) => {
    const { onRetry, loading, error, ...componentProps } = props;

    if (!onRetry) {
      return <Component {...(componentProps as P)} ref={ref} />;
    }

    return (
      <RetryWrapper
        onRetry={onRetry}
        loading={loading}
        error={error}
        retryConfig={retryConfig}
      >
        <Component {...(componentProps as P)} ref={ref} />
      </RetryWrapper>
    );
  });
};