import React from 'react';
import { TaskView } from './TaskView';
import type { Task, TaskStatus } from '../../types';

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design user interface mockups',
    description: 'Create wireframes and mockups for the new dashboard interface',
    status: 'TODO' as TaskStatus,
    assigneeEmail: 'designer@company.com',
    dueDate: '2024-12-15',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    project: {
      id: '1',
      name: 'Dashboard Redesign',
      description: 'Redesign the main dashboard',
      status: 'ACTIVE',
      taskCount: 5,
      completedTasks: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        contactEmail: 'contact@acme.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  },
  {
    id: '2',
    title: 'Implement authentication system',
    description: 'Set up JWT-based authentication with role-based access control',
    status: 'IN_PROGRESS' as TaskStatus,
    assigneeEmail: 'developer@company.com',
    dueDate: '2024-12-20',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    project: {
      id: '1',
      name: 'Dashboard Redesign',
      description: 'Redesign the main dashboard',
      status: 'ACTIVE',
      taskCount: 5,
      completedTasks: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        contactEmail: 'contact@acme.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
    comments: [
      {
        id: '1',
        content: 'Started working on the JWT implementation',
        authorEmail: 'developer@company.com',
        createdAt: '2024-01-03T00:00:00Z',
        task: {} as Task, // Circular reference simplified
      },
    ],
  },
  {
    id: '3',
    title: 'Write unit tests',
    description: 'Add comprehensive test coverage for the authentication module',
    status: 'DONE' as TaskStatus,
    assigneeEmail: 'tester@company.com',
    dueDate: '2024-11-30',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    project: {
      id: '1',
      name: 'Dashboard Redesign',
      description: 'Redesign the main dashboard',
      status: 'ACTIVE',
      taskCount: 5,
      completedTasks: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        contactEmail: 'contact@acme.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  },
  {
    id: '4',
    title: 'Database optimization',
    description: 'Optimize database queries for better performance',
    status: 'TODO' as TaskStatus,
    assigneeEmail: 'dba@company.com',
    dueDate: '2024-11-25', // Overdue
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    project: {
      id: '2',
      name: 'Performance Improvements',
      description: 'Improve system performance',
      status: 'ACTIVE',
      taskCount: 3,
      completedTasks: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        contactEmail: 'contact@acme.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  },
  {
    id: '5',
    title: 'API documentation',
    description: 'Create comprehensive API documentation using OpenAPI spec',
    status: 'IN_PROGRESS' as TaskStatus,
    assigneeEmail: 'tech-writer@company.com',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    project: {
      id: '2',
      name: 'Performance Improvements',
      description: 'Improve system performance',
      status: 'ACTIVE',
      taskCount: 3,
      completedTasks: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        contactEmail: 'contact@acme.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  },
];

export const TaskDemo: React.FC = () => {
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    console.log(`Task ${taskId} status changed to ${newStatus}`);
    // In a real app, this would update the task via API
  };

  const handleEditTask = (task: Task) => {
    console.log('Edit task:', task);
    // In a real app, this would open an edit modal/form
  };

  const handleDeleteTask = (taskId: string) => {
    console.log('Delete task:', taskId);
    // In a real app, this would show confirmation and delete
  };

  const handleCreateTask = () => {
    console.log('Create new task');
    // In a real app, this would open a create task modal/form
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Task Management Demo
          </h1>
          <p className="text-gray-600">
            Demonstration of the TaskView component with board and list views
          </p>
        </div>

        <TaskView
          tasks={mockTasks}
          onStatusChange={handleStatusChange}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onCreateTask={handleCreateTask}
          projectName="Demo Project"
        />
      </div>
    </div>
  );
};