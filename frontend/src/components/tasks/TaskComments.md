# TaskComments Component

The `TaskComments` component provides a complete interface for viewing and adding comments to tasks in the Mini Project Management System.

## Features

### Comment Display
- **Comment List**: Displays all comments for a task in chronological order
- **Author Information**: Shows author name (formatted from email if display name not available) and avatar with initials
- **Timestamps**: Relative time formatting (e.g., "2 hours ago", "just now") with full timestamp on hover
- **Content Formatting**: Preserves whitespace and line breaks in comment content

### Comment Creation
- **Add Comment Form**: Inline form for adding new comments
- **Form Validation**: Real-time validation for email and content fields
- **Author Email**: Required field for comment attribution
- **Content Input**: Multi-line textarea with proper validation

### Real-time Updates
- **Apollo Client Cache**: Automatic cache updates when new comments are added
- **Optimistic Updates**: Comments appear immediately after submission
- **Error Handling**: Graceful error handling with retry options
- **Loading States**: Proper loading indicators during operations

## Usage

### Basic Usage
```tsx
import { TaskComments } from '../components/tasks';

function TaskDetailPage({ taskId }: { taskId: string }) {
  return (
    <div>
      <h1>Task Details</h1>
      <TaskComments taskId={taskId} />
    </div>
  );
}
```

### With Custom Styling
```tsx
<TaskComments 
  taskId="task-123" 
  className="mt-6 border-t pt-6" 
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `taskId` | `string` | Yes | The ID of the task to display comments for |
| `className` | `string` | No | Additional CSS classes to apply to the component |

## GraphQL Integration

The component uses the following GraphQL operations:

### Queries
- `GetTaskCommentsQuery`: Fetches all comments for a task
  - Variables: `taskId`, `organizationSlug`, `limit`, `offset`
  - Returns: Array of `TaskCommentType` objects

### Mutations
- `CreateTaskCommentMutation`: Creates a new comment
  - Input: `CreateTaskCommentInput` (taskId, content, authorEmail, organizationSlug)
  - Returns: `CreateTaskCommentPayload` with success status and created comment

## State Management

### Apollo Client Cache
The component automatically updates the Apollo Client cache when:
- New comments are created (adds to existing comment list)
- Comments are loaded (caches the result for future use)

### Cache Policies
- **Fetch Policy**: `cache-and-network` for fresh data while showing cached results
- **Update Strategy**: Prepends new comments to existing list for chronological order

## Error Handling

### Network Errors
- Displays user-friendly error messages
- Provides retry functionality
- Maintains form state during errors

### Validation Errors
- Real-time form validation
- Field-specific error messages
- Prevents submission of invalid data

### GraphQL Errors
- Parses and displays GraphQL error messages
- Handles authentication and authorization errors
- Provides appropriate user feedback

## Accessibility

### Keyboard Navigation
- Full keyboard support for form interactions
- Proper tab order and focus management
- Enter key submission for forms

### Screen Readers
- Semantic HTML structure
- ARIA labels for interactive elements
- Proper heading hierarchy
- Time elements with machine-readable datetime attributes

### Visual Design
- High contrast colors for readability
- Clear visual hierarchy
- Responsive design for all screen sizes
- Touch-friendly interface on mobile devices

## Performance Considerations

### Optimization Features
- **Lazy Loading**: Comments loaded on demand
- **Pagination Support**: Built-in support for paginated comment loading
- **Memoization**: React.memo optimization for re-renders
- **Cache Efficiency**: Efficient Apollo Client cache usage

### Best Practices
- Minimal re-renders through proper dependency management
- Efficient GraphQL queries with only required fields
- Proper cleanup of subscriptions and event listeners

## Testing

### Unit Tests
- Component rendering tests
- Form validation tests
- User interaction tests
- Error handling tests

### Integration Tests
- GraphQL operation tests
- Apollo Client cache tests
- Organization context tests

### Test Files
- `TaskComments.test.tsx`: Comprehensive unit tests
- `TaskCommentsIntegration.test.tsx`: Integration tests
- `TaskCommentsDemo.tsx`: Interactive demo component

## Examples

### Empty State
When no comments exist, the component shows:
- Empty state illustration
- Encouraging message
- Primary action button to add first comment

### With Comments
When comments exist, the component shows:
- Comment count in header
- List of comments with author and timestamp
- Add comment button in header
- Expandable comment form

### Loading State
During data fetching:
- Loading spinner
- Skeleton placeholders (future enhancement)
- Disabled form elements during submission

## Future Enhancements

### Planned Features
- **Comment Editing**: Allow users to edit their own comments
- **Comment Deletion**: Allow comment removal with proper permissions
- **Rich Text**: Support for markdown or rich text formatting
- **Mentions**: @mention functionality for team members
- **Reactions**: Emoji reactions to comments
- **Real-time Updates**: WebSocket-based live updates

### Performance Improvements
- **Virtual Scrolling**: For tasks with many comments
- **Image Optimization**: Lazy loading of user avatars
- **Caching Strategy**: Enhanced caching for better performance

## Dependencies

### Required Packages
- `@apollo/client`: GraphQL client and state management
- `react`: React framework
- `react-dom`: React DOM rendering

### Generated Types
- Uses GraphQL Code Generator for type safety
- Imports from `../../graphql/generated/types`

### Internal Dependencies
- `useOrganization`: Organization context hook
- `LoadingSpinner`: Common loading component
- `ErrorMessage`: Common error display component

## Organization Context

The component requires an active organization context to function properly:
- Uses `useOrganization` hook for current organization
- Filters comments by organization slug
- Shows appropriate message when no organization selected

## Security Considerations

### Input Validation
- Email format validation
- Content length limits
- XSS prevention through proper escaping

### Authorization
- Organization-based access control
- Server-side validation of permissions
- Proper error handling for unauthorized access