# Task Components

This directory contains the task management components for the Mini Project Management System.

## Components

### TaskCard
A reusable card component for displaying individual tasks.

**Features:**
- Displays task title, description, status, assignee, and due date
- Interactive status buttons for quick status changes
- Edit and delete action buttons
- Visual indicators for overdue tasks
- Comment count display
- Responsive design

**Props:**
- `task`: Task object with all task data
- `onStatusChange`: Callback for status changes
- `onEdit`: Callback for edit action
- `onDelete`: Callback for delete action
- `isDragging`: Optional flag for drag-and-drop styling
- `className`: Optional additional CSS classes

### TaskBoard
A Kanban-style board view with status columns.

**Features:**
- Three columns: To Do, In Progress, Done
- Drag-and-drop ready structure (visual indicators included)
- Task count per column
- Empty state handling
- Loading state with skeleton UI
- Responsive grid layout

**Props:**
- `tasks`: Array of task objects
- `onStatusChange`: Callback for status changes
- `onEditTask`: Callback for task editing
- `onDeleteTask`: Callback for task deletion
- `loading`: Loading state flag

### TaskList
A table-style list view for tasks.

**Features:**
- Tabular layout with sortable columns
- Inline status dropdown for quick changes
- Assignee avatars and information
- Due date highlighting for overdue tasks
- Action buttons for edit/delete
- Responsive design with mobile optimization

**Props:**
- `tasks`: Array of task objects
- `onStatusChange`: Callback for status changes
- `onEditTask`: Callback for task editing
- `onDeleteTask`: Callback for task deletion
- `loading`: Loading state flag

### TaskView
Main container component that combines board and list views with view switching.

**Features:**
- Toggle between board and list views
- Task statistics dashboard
- View mode persistence
- Create task button
- Loading and error states
- Responsive header with controls

**Props:**
- `tasks`: Array of task objects
- `onStatusChange`: Callback for status changes
- `onEditTask`: Callback for task editing
- `onDeleteTask`: Callback for task deletion
- `onCreateTask`: Callback for task creation
- `loading`: Loading state flag
- `projectName`: Optional project name for header

## Usage

```tsx
import { TaskView } from './components/tasks';

function MyTaskPage() {
  const { tasks, loading } = useTasks();
  
  return (
    <TaskView
      tasks={tasks}
      loading={loading}
      onStatusChange={handleStatusChange}
      onEditTask={handleEditTask}
      onDeleteTask={handleDeleteTask}
      onCreateTask={handleCreateTask}
      projectName="My Project"
    />
  );
}
```

## Requirements Fulfilled

This implementation fulfills the following requirements from task 17:

### 8.1 - Task Board Interface
✅ **Board and list view options**: TaskView component provides toggle between board and list views
✅ **Visual task board**: TaskBoard component displays tasks in Kanban-style columns
✅ **Status columns**: Three columns for TODO, IN_PROGRESS, and DONE statuses

### 8.2 - Task Status Updates  
✅ **Intuitive status changes**: Both board and list views support click-to-change status
✅ **Immediate visual feedback**: Status changes are reflected immediately in the UI
✅ **Status validation**: Only valid status transitions are allowed

### 8.3 - Task Board Functionality
✅ **Status column grouping**: Tasks are automatically grouped by status in board view
✅ **Interactive task cards**: TaskCard component provides rich interaction capabilities
✅ **Responsive design**: All components work on desktop and mobile devices

## Task Details Completed

- ✅ **Create TaskBoard component with status column layout**: Implemented with three status columns
- ✅ **Implement TaskList component as alternative view**: Table-style list view with all task information
- ✅ **Add task status update functionality**: Click-based status changes in both views
- ✅ **Create TaskCard component with assignee and status display**: Rich task cards with all required information
- ✅ **Implement view switching between board and list modes**: Toggle buttons in TaskView header

## Future Enhancements

The components are designed to be extensible for future features:

1. **Drag-and-drop**: TaskBoard includes visual drop zones and drag styling props
2. **Real-time updates**: Components accept new task data and re-render automatically
3. **Filtering and sorting**: TaskView can be extended with filter controls
4. **Task details modal**: Edit/delete callbacks can open detailed task forms
5. **Bulk operations**: List view can be extended with checkboxes for bulk actions

## Testing

Test files are included for the main components:
- `TaskCard.test.tsx`: Unit tests for task card functionality
- `TaskView.test.tsx`: Integration tests for the main view component

Run tests with:
```bash
npm test TaskCard.test.tsx TaskView.test.tsx
```

## Demo

A demo component (`TaskDemo.tsx`) is available to showcase the functionality with mock data.