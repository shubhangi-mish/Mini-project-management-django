/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  ApolloClient, 
  InMemoryCache, 
  HttpLink, 
  from,
  DefaultOptions
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

// Simple retry logic using error link
const retryAttempts = new Map();

const getRetryCount = (operationName: string): number => {
  return retryAttempts.get(operationName) || 0;
};

const setRetryCount = (operationName: string, count: number): void => {
  retryAttempts.set(operationName, count);
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
    });
  }

  if (networkError) {
    const operationName = operation.operationName || 'unknown';
    const retryCount = getRetryCount(operationName);
    
    // eslint-disable-next-line no-console
    console.error('Network error:', {
      message: networkError.message,
      statusCode: 'statusCode' in networkError ? networkError.statusCode : undefined,
      operation: operationName,
      retryCount
    });
    
    // Handle specific network errors
    if ('statusCode' in networkError) {
      const statusCode = (networkError as { statusCode: number }).statusCode;
      
      if (statusCode === 401) {
        // Handle unauthorized access
        clearCurrentOrganizationSlug();
        // Could redirect to login page here
      } else if (statusCode === 403) {
        // Handle forbidden access
        console.warn('Access forbidden for operation:', operationName);
      } else if (statusCode >= 500 && retryCount < 3) {
        // Retry server errors up to 3 times
        setRetryCount(operationName, retryCount + 1);
        return forward(operation);
      }
    } else if (retryCount < 2) {
      // Retry network errors up to 2 times
      setRetryCount(operationName, retryCount + 1);
      return forward(operation);
    }
    
    // Reset retry count after final attempt
    setRetryCount(operationName, 0);
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
  connectToDevTools: import.meta.env.DEV,
});