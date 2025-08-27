import React, { useState } from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ErrorMessage, NetworkErrorMessage, ValidationErrorMessage, UnauthorizedErrorMessage } from '../common/ErrorMessage';
import { LoadingSpinner, InlineLoadingSpinner, ButtonLoadingSpinner, OverlayLoadingSpinner } from '../common/LoadingSpinner';
import { RetryWrapper, useRetry } from '../common/RetryWrapper';
import { FormField, useFormValidation } from '../common/FormField';
import { useLoadingState, useAsyncOperation } from '../../hooks/useLoadingState';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export const ErrorHandlingShowcase: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Error handler demo
  const errorHandler = useErrorHandler({
    logErrors: true,
    showToast: true,
    retryable: true,
  });

  // Form validation demo
  const formValidation = useFormValidation(
    { email: '', password: '', name: '' },
    {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 },
      name: { required: true, minLength: 2, maxLength: 50 },
    }
  );

  // Loading state demo
  const loadingState = useLoadingState({
    timeout: 5000,
    retryAttempts: 3,
  });

  // Async operation demo
  const asyncOperation = useAsyncOperation(
    async (shouldFail: boolean) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (shouldFail) {
        throw new Error('Simulated operation failure');
      }
      return { success: true, data: 'Operation completed successfully!' };
    },
    { retryAttempts: 2 }
  );

  // Retry demo
  const retryDemo = useRetry(
    async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Math.random() < 0.7) { // 70% chance of failure
        throw new Error('Random failure for demo');
      }
      // Success case - no return needed for void
    },
    { maxAttempts: 5 }
  );

  // Demo functions
  const triggerError = (type: string) => {
    switch (type) {
      case 'network':
        errorHandler.handleError(new Error('Network connection failed'), 'fetchData');
        break;
      case 'validation':
        errorHandler.handleError(new Error('Invalid email format'));
        break;
      case 'boundary':
        throw new Error('This error will be caught by ErrorBoundary');
      case 'apollo':
        const apolloError = {
          networkError: { statusCode: 500, message: 'Internal Server Error' },
          graphQLErrors: [],
          message: 'Apollo error simulation',
        };
        errorHandler.handleError(apolloError, 'apolloQuery');
        break;
      default:
        errorHandler.handleError(new Error('Unknown error type'));
    }
  };

  const simulateLoading = async (duration: number = 3000) => {
    await loadingState.executeWithLoading(async () => {
      await new Promise(resolve => setTimeout(resolve, duration));
      return { message: 'Loading completed!' };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formValidation.validateForm()) {
      console.log('Form is valid:', formValidation.values);
    } else {
      console.log('Form has errors:', formValidation.errors);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Error Handling & Loading States Showcase
        </h1>
        <p className="text-gray-600 mb-6">
          This showcase demonstrates comprehensive error handling and loading state components implemented for the project.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Error Boundary</h3>
            <p className="text-sm text-blue-700">Global error catching</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Loading States</h3>
            <p className="text-sm text-green-700">Comprehensive spinners</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900">Retry Logic</h3>
            <p className="text-sm text-yellow-700">Automatic retry with backoff</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Form Validation</h3>
            <p className="text-sm text-purple-700">Field-specific errors</p>
          </div>
        </div>
      </div>

      {/* Error Messages Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Messages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => triggerError('network')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Trigger Network Error
          </button>
          <button
            onClick={() => triggerError('validation')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Trigger Validation Error
          </button>
          <button
            onClick={() => triggerError('apollo')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Trigger Apollo Error
          </button>
          <ErrorBoundary
            fallback={
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error boundary caught this error!</p>
              </div>
            }
          >
            <button
              onClick={() => triggerError('boundary')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Trigger Boundary Error
            </button>
          </ErrorBoundary>
        </div>

        {/* Display current error */}
        {errorHandler.currentError && (
          <ErrorMessage
            title={`${errorHandler.currentError.type.toUpperCase()} Error`}
            message={errorHandler.getUserFriendlyMessage(errorHandler.currentError)}
            severity={errorHandler.currentError.type === 'validation' ? 'warning' : 'error'}
            onRetry={errorHandler.isRetryable(errorHandler.currentError) ? (() => {
              console.log('Retrying operation...');
              errorHandler.clearError();
            }) : undefined}
            onDismiss={() => errorHandler.clearError()}
            details={JSON.stringify(errorHandler.currentError.details, null, 2)}
          />
        )}

        {/* Specialized error messages */}
        <div className="space-y-4 mt-6">
          <h3 className="font-medium text-gray-900">Specialized Error Messages:</h3>
          <NetworkErrorMessage
            onRetry={() => console.log('Retrying network operation...')}
          />
          <UnauthorizedErrorMessage
            onLogin={() => console.log('Redirecting to login...')}
          />
        </div>
      </div>

      {/* Loading States Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Loading States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => simulateLoading(2000)}
            disabled={loadingState.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loadingState.isLoading ? <ButtonLoadingSpinner /> : 'Simulate Loading'}
          </button>
          <button
            onClick={() => setShowOverlay(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Show Overlay Loading
          </button>
          <button
            onClick={() => asyncOperation.execute(false)}
            disabled={asyncOperation.isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Async Operation
          </button>
        </div>

        {/* Loading state display */}
        {loadingState.isLoading && (
          <InlineLoadingSpinner text="Processing your request..." />
        )}

        {loadingState.data && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">✓ {loadingState.data.message}</p>
          </div>
        )}

        {/* Different spinner sizes */}
        <div className="space-y-4 mt-6">
          <h3 className="font-medium text-gray-900">Loading Spinner Variants:</h3>
          <div className="flex items-center space-x-6 flex-wrap">
            <LoadingSpinner size="xs" text="Extra Small" />
            <LoadingSpinner size="sm" text="Small" />
            <LoadingSpinner size="md" text="Medium" />
            <LoadingSpinner size="lg" text="Large" />
            <LoadingSpinner size="xl" text="Extra Large" />
          </div>
        </div>

        {/* Overlay loading */}
        {showOverlay && (
          <OverlayLoadingSpinner text="Loading overlay demo..." />
        )}
        {showOverlay && (
          <div className="mt-4">
            <button
              onClick={() => setShowOverlay(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Hide Overlay
            </button>
          </div>
        )}
      </div>

      {/* Retry Logic Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Retry Logic</h2>
        
        <RetryWrapper
          onRetry={retryDemo.execute}
          loading={retryDemo.loading}
          error={retryDemo.error}
          retryConfig={{ maxAttempts: 5, delay: 1000 }}
        >
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">✓ Operation succeeded!</p>
          </div>
        </RetryWrapper>

        <div className="mt-4 space-x-4">
          <button
            onClick={retryDemo.execute}
            disabled={retryDemo.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Try Operation (70% fail rate)
          </button>
          <button
            onClick={retryDemo.reset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Attempts: {retryDemo.attemptCount}/{retryDemo.maxAttempts}</p>
          <p>Can Retry: {retryDemo.canRetry ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Form Validation Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Validation</h2>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <FormField
            label="Name"
            name="name"
            value={formValidation.values.name}
            onChange={(value) => formValidation.setValue('name', value)}
            onBlur={() => formValidation.setFieldTouched('name')}
            validation={{ required: true, minLength: 2, maxLength: 50 }}
            error={formValidation.touched.name ? formValidation.errors.name || null : null}
            placeholder="Enter your full name"
            showCharacterCount
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={formValidation.values.email}
            onChange={(value) => formValidation.setValue('email', value)}
            onBlur={() => formValidation.setFieldTouched('email')}
            validation={{ required: true, email: true }}
            error={formValidation.touched.email ? formValidation.errors.email || null : null}
            placeholder="Enter your email address"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={formValidation.values.password}
            onChange={(value) => formValidation.setValue('password', value)}
            onBlur={() => formValidation.setFieldTouched('password')}
            validation={{ required: true, minLength: 8 }}
            error={formValidation.touched.password ? formValidation.errors.password || null : null}
            placeholder="Enter a secure password"
            helpText="Password must be at least 8 characters long"
          />

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Validate Form
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          <p>Form Valid: {formValidation.isValid ? 'Yes' : 'No'}</p>
          <p>Errors: {Object.keys(formValidation.errors).length}</p>
        </div>
      </div>

      {/* Error Statistics */}
      {errorHandler.hasErrors && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-900">Total Errors</h3>
              <p className="text-2xl font-bold text-red-600">{errorHandler.getErrorStats().total}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900">Recent Errors</h3>
              <p className="text-2xl font-bold text-yellow-600">{errorHandler.getErrorStats().recent.length}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Error Types</h3>
              <div className="text-sm text-blue-700">
                {Object.entries(errorHandler.getErrorStats().byType).map(([type, count]) => (
                  <div key={type}>{type}: {count}</div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={errorHandler.clearAllErrors}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Clear All Errors
          </button>
        </div>
      )}
    </div>
  );
};