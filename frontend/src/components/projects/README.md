# Project Components

This directory contains React components for project management functionality in the Mini Project Management System.

## Components

### ProjectCard

A reusable card component that displays project information in a compact, visually appealing format.

**Features:**
- Project name, description, and status display
- Progress bar showing task completion percentage
- Due date indicators with overdue/due soon warnings
- Task statistics (total tasks, completed tasks)
- Action buttons for edit and delete operations
- Responsive design with hover effects
- Status indicators with color coding

**Props:**
- `project: ProjectType` - The project data to display
- `onEdit?: (project: ProjectType) => void` - Optional callback for edit action
- `onDelete?: (project: ProjectType) => void` - Optional callback for delete action

**Usage:**
```tsx
import { ProjectCard } from '../components/projects';

<ProjectCard
  project={project}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### ProjectList

A comprehensive list component that displays multiple projects with filtering, sorting, and view options.

**Features:**
- Responsive grid and list view modes
- Real-time search functionality
- Status-based filtering (All, Active, Completed, On Hold)
- Multi-field sorting (name, status, due date, progress, created date)
- Loading and error states
- Empty state with call-to-action
- Pagination-ready design
- Mobile-responsive layout

**Props:**
- `projects: ProjectType[]` - Array of projects to display
- `loading?: boolean` - Loading state indicator
- `error?: string` - Error message to display
- `onCreateProject?: () => void` - Callback for creating new projects
- `onEditProject?: (project: ProjectType) => void` - Callback for editing projects
- `onDeleteProject?: (project: ProjectType) => void` - Callback for deleting projects

**Usage:**
```tsx
import { ProjectList } from '../components/projects';

<ProjectList
  projects={projects}
  loading={loading}
  error={error}
  onCreateProject={handleCreate}
  onEditProject={handleEdit}
  onDeleteProject={handleDelete}
/>
```

## Common Components

### LoadingSpinner

A reusable loading spinner component with size variants.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Size of the spinner (default: 'md')
- `className?: string` - Additional CSS classes

### ErrorMessage

A reusable error message component with retry functionality.

**Props:**
- `message: string` - Error message to display
- `title?: string` - Error title (default: 'Error')
- `onRetry?: () => void` - Optional retry callback
- `className?: string` - Additional CSS classes

## Styling

All components use TailwindCSS for styling with the following design principles:

- **Responsive Design**: Mobile-first approach with breakpoints for tablet and desktop
- **Accessibility**: Proper ARIA labels, keyboard navigation, and color contrast
- **Consistency**: Unified color scheme and spacing using design tokens
- **Performance**: Optimized animations and transitions

### Color Scheme

- **Primary**: Blue (blue-600, blue-700)
- **Success**: Green (green-600, green-100)
- **Warning**: Yellow (yellow-600, yellow-100)
- **Error**: Red (red-600, red-100)
- **Neutral**: Gray scale (gray-50 to gray-900)

### Status Colors

- **Active**: Green background with green text
- **Completed**: Blue background with blue text
- **On Hold**: Yellow background with yellow text

## Integration

The project components are integrated with:

1. **GraphQL API**: Uses generated types from `../graphql/generated/types`
2. **Apollo Client**: For data fetching and caching
3. **React Router**: For navigation between project views
4. **Organization Context**: For multi-tenant data isolation

## Testing

Basic component tests are included in `ProjectList.test.tsx` with mock data for development and testing purposes.

## Future Enhancements

- Drag-and-drop functionality for project reordering
- Bulk operations (select multiple projects)
- Advanced filtering options (date ranges, assignees)
- Export functionality (CSV, PDF)
- Real-time updates via GraphQL subscriptions
- Keyboard shortcuts for power users

## Requirements Satisfied

This implementation satisfies the following requirements from task 15:

✅ **Responsive Grid Layout**: ProjectList supports both grid and list views with responsive breakpoints
✅ **Status Indicators**: ProjectCard displays status with color-coded badges and icons
✅ **Filtering and Sorting**: ProjectList includes search, status filter, and multi-field sorting
✅ **TailwindCSS Responsive Design**: All components use TailwindCSS with mobile-first responsive design
✅ **Loading States**: LoadingSpinner component handles async operation states
✅ **Error Handling**: ErrorMessage component provides user-friendly error display with retry options

The components follow React best practices, TypeScript for type safety, and modern UI/UX patterns for an optimal user experience.