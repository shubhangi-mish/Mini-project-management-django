import React from 'react';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ErrorMessageProps {
  message: string;
  title?: string;
  severity?: ErrorSeverity;
  onRetry?: (() => void) | undefined;
  onDismiss?: () => void;
  actions?: ErrorAction[];
  className?: string;
  details?: string;
  showDetails?: boolean;
}

const severityConfig = {
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-400',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    buttonBg: 'bg-red-100 hover:bg-red-200',
    buttonText: 'text-red-700',
    focusRing: 'focus:ring-red-500',
    icon: (
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    ),
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-800',
    textColor: 'text-yellow-700',
    buttonBg: 'bg-yellow-100 hover:bg-yellow-200',
    buttonText: 'text-yellow-700',
    focusRing: 'focus:ring-yellow-500',
    icon: (
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    ),
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
    buttonBg: 'bg-blue-100 hover:bg-blue-200',
    buttonText: 'text-blue-700',
    focusRing: 'focus:ring-blue-500',
    icon: (
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    ),
  },
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  severity = 'error',
  onRetry,
  onDismiss,
  actions = [],
  className = '',
  details,
  showDetails = false,
}) => {
  const [isDetailsVisible, setIsDetailsVisible] = React.useState(showDetails);
  const config = severityConfig[severity];

  // Combine default retry action with custom actions
  const allActions = React.useMemo(() => {
    const actionList: ErrorAction[] = [...actions];
    
    if (onRetry) {
      actionList.unshift({
        label: 'Try Again',
        onClick: onRetry,
        variant: 'primary',
      });
    }
    
    return actionList;
  }, [actions, onRetry]);

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className={`h-5 w-5 ${config.iconColor}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            {config.icon}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${config.titleColor}`}>{title}</h3>
              <div className={`mt-2 text-sm ${config.textColor}`}>
                <p>{message}</p>
              </div>
            </div>
            {onDismiss && (
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={onDismiss}
                    className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:${config.bgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.focusRing}`}
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error details */}
          {details && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                className={`text-sm ${config.buttonText} hover:underline focus:outline-none`}
              >
                {isDetailsVisible ? 'Hide Details' : 'Show Details'}
              </button>
              {isDetailsVisible && (
                <div className={`mt-2 text-xs ${config.textColor} bg-white bg-opacity-50 rounded p-2 font-mono`}>
                  <pre className="whitespace-pre-wrap break-all">{details}</pre>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {allActions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {allActions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.focusRing} ${
                    action.variant === 'primary'
                      ? `${config.buttonText} ${config.buttonBg}`
                      : `${config.textColor} bg-white hover:bg-gray-50 border-gray-300`
                  }`}
                >
                  {action.label === 'Try Again' && (
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized error message components
export const NetworkErrorMessage: React.FC<{
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ onRetry, onDismiss }) => (
  <ErrorMessage
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    onDismiss={onDismiss}
    actions={[
      {
        label: 'Check Connection',
        onClick: () => window.open('https://www.google.com', '_blank'),
        variant: 'secondary',
      },
    ]}
  />
);

export const ValidationErrorMessage: React.FC<{
  errors: string[];
  onDismiss?: () => void;
}> = ({ errors, onDismiss }) => (
  <ErrorMessage
    title="Validation Error"
    message={errors.length === 1 ? errors[0] : `${errors.length} validation errors occurred:`}
    severity="warning"
    onDismiss={onDismiss}
    details={errors.length > 1 ? errors.join('\n') : undefined}
  />
);

export const UnauthorizedErrorMessage: React.FC<{
  onLogin?: () => void;
  onDismiss?: () => void;
}> = ({ onLogin, onDismiss }) => (
  <ErrorMessage
    title="Access Denied"
    message="You don't have permission to access this resource. Please log in or contact your administrator."
    severity="warning"
    onDismiss={onDismiss}
    actions={onLogin ? [
      {
        label: 'Log In',
        onClick: onLogin,
        variant: 'primary',
      },
    ] : []}
  />
);