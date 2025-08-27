import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ErrorMessage, NetworkErrorMessage, ValidationErrorMessage, UnauthorizedErrorMessage } from '../components/common/ErrorMessage';
import { LoadingSpinner, InlineLoadingSpinner, ButtonLoadingSpinner, OverlayLoadingSpinner } from '../components/common/LoadingSpinner';
import { RetryWrapper, useRetry } from '../components/common/RetryWrapper';
import { FormField, useFormValidation } from '../components/common/FormField';
import { useLoadingState, useAsyncOperation } from '../hooks/useLoadingState';
import { useErrorHandler, useFormErrorHandler } from '../hooks/useErrorHandler';

export const ErrorHandlingDemo: React.FC = () => {
  // Demo state removed as not used in current implementation
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Error handler demo
  const errorHandler = useErrorHandler({
    logErrors: true,
    showToast: true,
    retryable: true,
  });

  // Form validation demo
  const formErrorHandler = useFormErrorHandler();
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
        formErrorHandler.handleValidationError(new Error('Invalid email format'));
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
      formErrorHandler.clearAllErrors();
    } else {
      console.log('Form has errors:', formValidation.errors);
    }
  };

  return (
    <Layout title="Error Handling & Loading States Demo">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comprehensive Error Handling & Loading States
          </h2>
          <p className="text-gray-600 mb-4">
            This demo showcases all the error handling and loading state components implemented for the project.
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Messages</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => triggerError('network')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Trigger Network Error
            </button>
            <button
              onClick={() => triggerError('validation')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Trigger Validation Error
            </button>
            <button
              onClick={() => triggerError('apollo')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
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
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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

          {/* Form validation error */}
          {formErrorHandler.generalError && (
            <ValidationErrorMessage
              errors={[formErrorHandler.generalError]}
              onDismiss={() => formErrorHandler.clearAllErrors()}
            />
          )}

          {/* Specialized error messages */}
          <div className="space-y-4 mt-6">
            <h4 className="font-medium text-gray-900">Specialized Error Messages:</h4>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading States</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => simulateLoading(2000)}
              disabled={loadingState.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingState.isLoading ? <ButtonLoadingSpinner /> : 'Simulate Loading'}
            </button>
            <button
              onClick={() => setShowOverlay(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Show Overlay Loading
            </button>
            <button
              onClick={() => asyncOperation.execute(false)}
              disabled={asyncOperation.isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
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
            <h4 className="font-medium text-gray-900">Loading Spinner Variants:</h4>
            <div className="flex items-center space-x-6">
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Hide Overlay
              </button>
            </div>
          )}
        </div>

        {/* Retry Logic Demo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retry Logic</h3>
          
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Try Operation (70% fail rate)
            </button>
            <button
              onClick={retryDemo.reset}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Validation</h3>
          
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
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900">Total Errors</h4>
                <p className="text-2xl font-bold text-red-600">{errorHandler.getErrorStats().total}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900">Recent Errors</h4>
                <p className="text-2xl font-bold text-yellow-600">{errorHandler.getErrorStats().recent.length}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Error Types</h4>
                <div className="text-sm text-blue-700">
                  {Object.entries(errorHandler.getErrorStats().byType).map(([type, count]) => (
                    <div key={type}>{type}: {count}</div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={errorHandler.clearAllErrors}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear All Errors
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};