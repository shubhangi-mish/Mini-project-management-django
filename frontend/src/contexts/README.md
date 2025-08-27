# Organization Context

This directory contains the React Context implementation for managing organization state across the application.

## Features

- **Organization Selection**: Users can select from available organizations
- **Context Persistence**: Selected organization is stored in localStorage
- **URL-based Routing**: Organization context is reflected in the URL (`/org/{slug}`)
- **Apollo Client Integration**: Cache is cleared when switching organizations
- **Error Handling**: Comprehensive error handling for invalid organizations
- **Loading States**: Loading indicators during organization switches

## Components

### OrganizationContext
The main React Context that provides organization state and methods.

**Exports:**
- `OrganizationProvider` - Context provider component
- `useOrganizationContext` - Hook to access organization context

### OrganizationSelector
A dropdown component for selecting organizations.

**Props:**
- `className?: string` - Additional CSS classes
- `showLabel?: boolean` - Whether to show the "Organization" label

### OrganizationSelection
A full-page component for organization selection when no organization is selected.

### OrganizationRoute
A route guard component that ensures organization context is available before rendering children.

## Usage

### Basic Setup

```tsx
import { OrganizationProvider } from './contexts/OrganizationContext';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <OrganizationProvider>
        {/* Your app components */}
      </OrganizationProvider>
    </Router>
  );
}
```

### Using the Context

```tsx
import { useOrganizationContext } from './contexts/OrganizationContext';

function MyComponent() {
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization, 
    isLoading, 
    error 
  } = useOrganizationContext();

  return (
    <div>
      <h1>Current: {currentOrganization?.name}</h1>
      <button onClick={() => switchOrganization('new-org-slug')}>
        Switch Organization
      </button>
    </div>
  );
}
```

### Protected Routes

```tsx
import { OrganizationRoute } from './components/routing/OrganizationRoute';

function App() {
  return (
    <Routes>
      <Route path="/org/:organizationSlug/dashboard" element={
        <OrganizationRoute>
          <Dashboard />
        </OrganizationRoute>
      } />
    </Routes>
  );
}
```

## URL Structure

- `/` - Organization selection page
- `/org/{slug}` - Organization dashboard
- `/org/{slug}/projects` - Projects page for organization
- `/org/{slug}/tasks` - Tasks page for organization

## Data Flow

1. User visits the app
2. OrganizationProvider initializes from URL params or localStorage
3. If no organization is selected, redirect to organization selection
4. User selects organization
5. Context updates, localStorage is updated, Apollo cache is cleared
6. User is redirected to organization dashboard
7. All subsequent API calls include organization context

## Error Handling

- Invalid organization slugs in URL redirect to organization selection
- Network errors during organization switching are displayed to user
- Missing organization context shows appropriate error messages
- Graceful fallbacks for all error states

## Integration with GraphQL

The organization context automatically:
- Adds organization headers to GraphQL requests
- Clears Apollo Client cache when switching organizations
- Validates organization context before making requests
- Provides organization slug for all queries and mutations