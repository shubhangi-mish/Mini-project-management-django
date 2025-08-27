# Apollo Client and GraphQL Configuration

This document describes the Apollo Client setup and GraphQL code generation configuration for the Mini Project Management frontend.

## Overview

The frontend uses Apollo Client for GraphQL state management with the following key features:

- **Type-safe GraphQL operations** with generated TypeScript types
- **Organization context management** with automatic header injection
- **Optimistic updates** for better user experience
- **Error handling and retry logic** for network resilience
- **Cache management** with proper cache policies

## Configuration Files

### 1. Apollo Client Setup (`src/utils/apolloClient.ts`)

The Apollo Client is configured with:

- **HTTP Link**: Connects to the GraphQL endpoint
- **Auth Link**: Automatically adds organization context headers
- **Error Link**: Handles GraphQL and network errors with retry logic
- **Cache Configuration**: Optimized cache policies for different data types

Key features:
- Organization slug automatically added to request headers
- Retry logic for network failures (up to 3 attempts for server errors)
- Proper error logging and handling
- Cache policies for efficient data fetching

### 2. GraphQL Code Generation (`codegen.ts`)

Configured to generate:
- TypeScript types for all GraphQL operations
- React hooks for queries and mutations
- Introspection schema for development tools

### 3. Organization Context (`src/utils/organizationContext.ts`)

Utility functions for managing organization context:
- Get/set current organization slug
- Validate organization context
- Generate organization headers

## GraphQL Operations

### Queries

Located in `src/graphql/queries/`:

- **Projects**: `projects.graphql`
  - `GetProjects` - List projects with filtering
  - `GetProject` - Single project with tasks and statistics
  - `GetProjectStatistics` - Project analytics
  - `GetOrganizationStatistics` - Organization-wide analytics

- **Tasks**: `tasks.graphql`
  - `GetTasks` - List tasks with filtering
  - `GetTask` - Single task with comments
  - `GetTaskComments` - Task comments

### Mutations

Located in `src/graphql/mutations/`:

- **Projects**: `projects.graphql`
  - `CreateProject` - Create new project
  - `UpdateProject` - Update existing project
  - `DeleteProject` - Delete project

- **Tasks**: `tasks.graphql`
  - `CreateTask` - Create new task
  - `UpdateTask` - Update existing task
  - `DeleteTask` - Delete task
  - `CreateTaskComment` - Add task comment

### Fragments

Located in `src/graphql/fragments.graphql`:

Reusable field selections for consistent data fetching across operations.

## Custom Hooks

### Project Hooks (`src/hooks/useProjects.ts`)

- `useProjects()` - Fetch projects list with organization context
- `useProject(id)` - Fetch single project
- `useProjectMutations()` - Project CRUD operations

### Task Hooks (`src/hooks/useTasks.ts`)

- `useTasks()` - Fetch tasks list with filtering
- `useTask(id)` - Fetch single task
- `useTaskMutations()` - Task CRUD operations and comments

### Organization Hook (`src/hooks/useOrganization.ts`)

- Organization context management
- Organization switching with cache clearing
- Mock organization data for development

## Cache Management

The Apollo Client cache is configured with:

### Type Policies

- **Query fields**: Proper key arguments for cache normalization
- **Project/Task relationships**: Efficient merge strategies
- **Statistics**: Keyed by project/organization ID

### Cache Updates

- **Optimistic updates** for mutations
- **Automatic cache invalidation** on deletions
- **Cache eviction** when switching organizations

## Error Handling

### GraphQL Errors

- Logged with operation context
- Specific handling for authentication errors
- User-friendly error messages

### Network Errors

- Automatic retry for server errors (5xx)
- Retry for network connectivity issues
- Proper error logging and user feedback

## Development Workflow

### 1. Code Generation

```bash
# Generate types from schema
npm run codegen

# Watch mode for development
npm run codegen:watch
```

### 2. Schema Updates

When the backend schema changes:

1. Update `src/graphql/schema.graphql` (or use live endpoint)
2. Run code generation
3. Update queries/mutations as needed
4. Update TypeScript types if necessary

### 3. Adding New Operations

1. Create GraphQL files in appropriate directories
2. Run code generation to create TypeScript types
3. Use generated hooks in components
4. Add cache update logic for mutations if needed

## Environment Configuration

Required environment variables in `.env`:

```env
VITE_GRAPHQL_ENDPOINT=http://localhost:8000/graphql/
VITE_APP_NAME=Mini Project Management
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true
```

## Testing

The `ApolloTest` component (`src/components/common/ApolloTest.tsx`) provides:

- Organization context testing
- GraphQL query execution testing
- Error handling verification
- Cache behavior validation

## Best Practices

### 1. Organization Context

Always use organization context utilities:
```typescript
import { getRequiredOrganizationSlug } from '../utils/organizationContext';

const organizationSlug = getRequiredOrganizationSlug();
```

### 2. Error Handling

Use the `errorPolicy: 'all'` to handle partial errors:
```typescript
const { data, loading, error } = useQuery(QUERY, {
  errorPolicy: 'all'
});
```

### 3. Cache Updates

Implement optimistic updates for better UX:
```typescript
const [createMutation] = useMutation(CREATE_MUTATION, {
  update: (cache, { data }) => {
    // Update cache optimistically
  }
});
```

### 4. Type Safety

Always use generated types:
```typescript
import { GetProjectsQuery, GetProjectsQueryVariables } from '../graphql/generated/types';
```

## Troubleshooting

### Common Issues

1. **Organization context not set**: Ensure organization is selected before making queries
2. **Cache inconsistencies**: Clear cache when switching organizations
3. **Network errors**: Check backend server status and endpoint configuration
4. **Type errors**: Regenerate types after schema changes

### Debug Tools

- Apollo Client DevTools browser extension
- GraphQL Playground/GraphiQL for query testing
- Network tab for request inspection
- Console logs for error details