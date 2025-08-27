import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskView } from './TaskView';
import type { Task, TaskStatus } from '../../types';

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'This is a test task',
    status: 'TODO' as TaskStatus,
    assigneeEmail: 'test@example.com',
    dueDate: '2024-12-31',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    project: {
      id: '1',
      name: 'Test Project',
      description: 'Test project description',
      status: 'ACTIVE',
      taskCount: 1,
      completedTasks: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        contactEmail: 'contact@test.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Another test task',
    status: 'IN_PROGRESS' as TaskStatus,
    assigneeEmail: 'user@example.com',
    dueDate: '2024-11-30',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    project: {
      id: '1',
      name: 'Test Project',
      description: 'Test project description',
      status: 'ACTIVE',
      taskCount: 2,
      completedTasks: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      organization: {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        contactEmail: 'contact@test.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  },
];

describe('TaskView', () => {
  const mockProps = {
    tasks: mockTasks,
    onStatusChange: jest.fn(),
    onEditTask: jest.fn(),
    onDeleteTask: jest.fn(),
    onCreateTask: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task view with board mode by default', () => {
    render(<TaskView {...mockProps} />);
    
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
  });

  it('displays task statistics correctly', () => {
    render(<TaskView {...mockProps} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    
    // Check task counts
    const todoCount = screen.getByText('1'); // 1 TODO task
    const inProgressCount = screen.getByText('1'); // 1 IN_PROGRESS task
    const doneCount = screen.getByText('0'); // 0 DONE tasks
    
    expect(todoCount).toBeInTheDocument();
    expect(inProgressCount).toBeInTheDocument();
    expect(doneCount).toBeInTheDocument();
  });

  it('switches between board and list views', () => {
    render(<TaskView {...mockProps} />);
    
    // Should start in board view
    expect(screen.getByText('To Do')).toBeInTheDocument(); // Board column header
    
    // Switch to list view
    const listButton = screen.getByRole('button', { name: /list/i });
    fireEvent.click(listButton);
    
    // Should now show list headers
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
  });

  it('calls onCreateTask when new task button is clicked', () => {
    render(<TaskView {...mockProps} />);
    
    const newTaskButton = screen.getByRole('button', { name: /new task/i });
    fireEvent.click(newTaskButton);
    
    expect(mockProps.onCreateTask).toHaveBeenCalledTimes(1);
  });

  it('displays loading state correctly', () => {
    render(<TaskView {...mockProps} loading={true} />);
    
    // Should show loading skeletons
    expect(screen.getAllByText('To Do')).toHaveLength(1); // Column header
  });

  it('displays project name when provided', () => {
    render(<TaskView {...mockProps} projectName="My Project" />);
    
    expect(screen.getByText('My Project Tasks')).toBeInTheDocument();
  });

  it('handles empty task list', () => {
    render(<TaskView {...mockProps} tasks={[]} />);
    
    expect(screen.getByText('0 tasks')).toBeInTheDocument();
  });
});