/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { 
  ApolloClient, 
  InMemoryCache, 
  HttpLink, 
  from,
  type DefaultOptions
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getOrganizationHeaders, clearCurrentOrganizationSlug } from './organizationContext';

// HTTP link to GraphQL endpoint
const httpLink = new HttpLink({
  uri: (import.meta.env['VITE_GRAPHQL_ENDPOINT'] as string) || 'http://localhost:8000/graphql/',
});

// Auth link to add organization context to headers
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...(headers as Record<string, string>),
      ...getOrganizationHeaders(),
    }
  };
});

// Enhanced error handling with retry logic
const retryAttempts = new Map<string, number>();

const shouldRetry = (error: any, operation: any): boolean => {
  const operationName = operation.operationName || 'unknown';
  const currentAttempts = retryAttempts.get(operationName) || 0;
  
  if (currentAttempts >= 3) {
    return false; // Max 3 retry attempts
  }

  // Retry on network errors and server errors (5xx)
  if (error && 'networkError' in error && error.networkError) {
    const networkError = error.networkError as any;
    
    // Don't retry on client errors (4xx) except 408, 429
    if ('statusCode' in networkError) {
      const statusCode = networkError.statusCode;
      return statusCode >= 500 || statusCode === 408 || statusCode === 429;
    }
    
    // Retry on network failures (no status code)
    return true;
  }
  
  // Don't retry on GraphQL errors
  return false;
};

// Error link for handling GraphQL and network errors
const errorLink = onError((errorResponse: any) => {
  const { graphQLErrors, networkError, operation, forward } = errorResponse;
  
  if (graphQLErrors) {
    graphQLErrors.forEach((error: any) => {
      // eslint-disable-next-line no-console
      console.error('GraphQL error:', {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
        operation: operation.operationName
      });
      
      // Handle specific GraphQL errors
      if (error.extensions?.code === 'UNAUTHENTICATED') {
        clearCurrentOrganizationSlug();
        // Could redirect to login page here
      }
      
      // Show user-friendly error messages for common GraphQL errors
      if (error.extensions?.code === 'VALIDATION_ERROR') {
        // These will be handled by form components
        console.warn('Validation error:', error.message);
      }
      
      if (error.extensions?.code === 'NOT_FOUND') {
        console.warn('Resource not found:', error.message);
      }
    });
  }

  if (networkError) {
    const operationName = operation.operationName || 'unknown';
    
    // eslint-disable-next-line no-console
    console.error('Network error:', {
      message: networkError.message,
      statusCode: 'statusCode' in networkError ? networkError.statusCode : undefined,
      operation: operationName,
    });
    
    // Check if we should retry
    if (shouldRetry(errorResponse, operation)) {
      const currentAttempts = retryAttempts.get(operationName) || 0;
      retryAttempts.set(operationName, currentAttempts + 1);
      
      // Add delay before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, currentAttempts), 10000);
      
      setTimeout(() => {
        forward(operation);
      }, delay);
      
      return; // Don't continue with error handling, we're retrying
    }
    
    // Reset retry count after final attempt
    retryAttempts.delete(operationName);
    
    // Handle specific network errors
    if ('statusCode' in networkError) {
      const statusCode = (networkError as { statusCode: number }).statusCode;
      
      if (statusCode === 401) {
        // Handle unauthorized access
        clearCurrentOrganizationSlug();
        console.warn('Unauthorized access - clearing organization context');
      } else if (statusCode === 403) {
        // Handle forbidden access
        console.warn('Access forbidden for operation:', operationName);
      } else if (statusCode === 404) {
        console.warn('Resource not found for operation:', operationName);
      } else if (statusCode >= 500) {
        console.error('Server error for operation:', operationName);
      }
    } else {
      // Network connectivity issues
      console.error('Network connectivity error for operation:', operationName);
    }
  }
});

// Default options for Apollo Client
const defaultOptions: DefaultOptions = {
  watchQuery: {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  },
  query: {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  },
  mutate: {
    errorPolicy: 'all',
  },
};

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projects: {
            keyArgs: ['organizationSlug', 'status'],
            merge(existing = [], incoming: unknown[]) {
              return incoming;
            },
          },
          tasks: {
            keyArgs: ['organizationSlug', 'projectId', 'status', 'assigneeEmail'],
            merge(existing = [], incoming: unknown[]) {
              return incoming;
            },
          },
          taskComments: {
            keyArgs: ['taskId', 'organizationSlug'],
            merge(existing = [], incoming: unknown[]) {
              return incoming;
            },
          },
        },
      },
      Project: {
        fields: {
          tasks: {
            merge(_existing = [], incoming: unknown[]) {
              return incoming;
            },
          },
        },
      },
      Task: {
        fields: {
          comments: {
            merge(_existing = [], incoming: unknown[]) {
              return incoming;
            },
          },
        },
      },
      ProjectStatistics: {
        keyFields: ['projectId'],
      },
      OrganizationStatistics: {
        keyFields: ['organizationId'],
      },
    },
  }),
  defaultOptions,
});