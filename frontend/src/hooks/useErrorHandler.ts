import { useState, useCallback, useRef } from 'react';

export interface ErrorInfo {
  message: string;
  code?: string;
  type: 'network' | 'graphql' | 'validation' | 'unknown';
  details?: any;
  timestamp: Date;
  operation?: string;
}

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  showToast?: boolean;
  retryable?: boolean;
  onError?: (error: ErrorInfo) => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    logErrors = true,
    showToast = false,
    retryable = true,
    onError,
  } = options;

  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  // Removed unused errorIdRef

  // Parse different types of errors
  const parseError = useCallback((error: any, operation?: string): ErrorInfo => {
    const timestamp = new Date();

    // Check if it's an Apollo-like error (has networkError or graphQLErrors)
    const isApolloError = error && (error.networkError || error.graphQLErrors);

    if (isApolloError) {
      if (error.networkError) {
        const networkError = error.networkError as any;
        return {
          message: networkError.message || 'Network error occurred',
          code: networkError.statusCode?.toString(),
          type: 'network' as const,
          details: {
            statusCode: networkError.statusCode,
            networkError: true,
            apolloError: true,
          },
          timestamp,
          ...(operation && { operation }),
        };
      }

      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const gqlError = error.graphQLErrors[0];
        const errorType = gqlError.extensions?.code === 'VALIDATION_ERROR' ? 'validation' : 'graphql';
        return {
          message: gqlError.message,
          code: gqlError.extensions?.code as string,
          type: errorType as 'validation' | 'graphql',
          details: {
            path: gqlError.path,
            extensions: gqlError.extensions,
            apolloError: true,
          },
          timestamp,
          ...(operation && { operation }),
        };
      }

      return {
        message: error.message || 'GraphQL error occurred',
        type: 'graphql' as const,
        details: { apolloError: true },
        timestamp,
        ...(operation && { operation }),
      };
    }

    // Standard Error objects
    if (error instanceof Error) {
      return {
        message: error.message,
        type: 'unknown' as const,
        details: {
          name: error.name,
          stack: error.stack,
        },
        timestamp,
        ...(operation && { operation }),
      };
    }

    // String errors
    if (typeof error === 'string') {
      return {
        message: error,
        type: 'unknown' as const,
        timestamp,
        ...(operation && { operation }),
      };
    }

    // Unknown error types
    return {
      message: 'An unknown error occurred',
      type: 'unknown' as const,
      details: error,
      timestamp,
      ...(operation && { operation }),
    };
  }, []);

  // Handle error
  const handleError = useCallback((error: any, operation?: string) => {
    const errorInfo = parseError(error, operation);

    // Log error if enabled
    if (logErrors) {
      console.error('Error handled:', errorInfo);
    }

    // Add to errors list
    setErrors(prev => [errorInfo, ...prev.slice(0, 9)]); // Keep last 10 errors
    setCurrentError(errorInfo);

    // Call custom error handler
    onError?.(errorInfo);

    // Show toast notification if enabled
    if (showToast) {
      // This would integrate with a toast notification system
      console.warn('Toast notification:', errorInfo.message);
    }

    return errorInfo;
  }, [parseError, logErrors, onError, showToast]);

  // Clear current error
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);
  }, []);

  // Get user-friendly error message
  const getUserFriendlyMessage = useCallback((error: ErrorInfo): string => {
    switch (error.type) {
      case 'network':
        if (error.code === '404') {
          return 'The requested resource was not found.';
        }
        if (error.code === '401') {
          return 'You are not authorized to access this resource.';
        }
        if (error.code === '403') {
          return 'You do not have permission to perform this action.';
        }
        if (error.code === '500') {
          return 'A server error occurred. Please try again later.';
        }
        return 'A network error occurred. Please check your connection and try again.';

      case 'validation':
        return error.message; // Validation messages are usually user-friendly

      case 'graphql':
        if (error.code === 'NOT_FOUND') {
          return 'The requested item was not found.';
        }
        if (error.code === 'UNAUTHENTICATED') {
          return 'Please log in to continue.';
        }
        if (error.code === 'FORBIDDEN') {
          return 'You do not have permission to perform this action.';
        }
        return error.message;

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }, []);

  // Check if error is retryable
  const isRetryable = useCallback((error: ErrorInfo): boolean => {
    if (!retryable) return false;

    switch (error.type) {
      case 'network':
        // Retry on server errors and timeouts, but not client errors
        const statusCode = error.details?.statusCode;
        return !statusCode || statusCode >= 500 || statusCode === 408 || statusCode === 429;

      case 'graphql':
        // Don't retry on authentication/authorization errors
        return !['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND'].includes(error.code || '');

      case 'validation':
        return false; // Don't retry validation errors

      default:
        return true; // Retry unknown errors
    }
  }, [retryable]);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    const stats = {
      total: errors.length,
      byType: {} as Record<string, number>,
      recent: errors.filter(e => Date.now() - e.timestamp.getTime() < 5 * 60 * 1000), // Last 5 minutes
    };

    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }, [errors]);

  return {
    errors,
    currentError,
    handleError,
    clearError,
    clearAllErrors,
    getUserFriendlyMessage,
    isRetryable,
    getErrorStats,
    hasErrors: errors.length > 0,
    hasCurrentError: currentError !== null,
  };
};

// Hook for handling form validation errors
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleValidationError = useCallback((error: any) => {
    if (error && error.graphQLErrors) {
      const validationError = error.graphQLErrors.find(
        (e: any) => e.extensions?.code === 'VALIDATION_ERROR'
      );

      if (validationError && validationError.extensions?.validationErrors) {
        const errors = validationError.extensions.validationErrors as Record<string, string[]>;
        const fieldErrorMap: Record<string, string> = {};

        Object.entries(errors).forEach(([field, messages]) => {
          fieldErrorMap[field] = messages[0]; // Take first error message
        });

        setFieldErrors(fieldErrorMap);
        setGeneralError(null);
        return true; // Handled as validation error
      }
    }

    // Not a validation error, set as general error
    const message = error instanceof Error ? error.message : String(error);
    setGeneralError(message);
    setFieldErrors({});
    return false; // Not handled as validation error
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const hasErrors = hasFieldErrors || generalError !== null;

  return {
    fieldErrors,
    generalError,
    handleValidationError,
    clearFieldError,
    clearAllErrors,
    hasFieldErrors,
    hasErrors,
  };
};