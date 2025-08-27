import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../../types';

// Mock task data
const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task description',
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
  comments: [
    {
      id: '1',
      content: 'Test comment',
      authorEmail: 'author@test.com',
      createdAt: '2024-01-01T00:00:00Z',
      task: {} as Task, // Circular reference, simplified for test
    },
  ],
};

describe('TaskCard', () => {
  const mockProps = {
    task: mockTask,
    onStatusChange: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(<TaskCard {...mockProps} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument(); // Assignee username
    expect(screen.getByText('1')).toBeInTheDocument(); // Comment count
  });

  it('displays status buttons correctly', () => {
    render(<TaskCard {...mockProps} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('calls onStatusChange when status button is clicked', () => {
    render(<TaskCard {...mockProps} />);
    
    const inProgressButton = screen.getByRole('button', { name: /change status to in progress/i });
    fireEvent.click(inProgressButton);
    
    expect(mockProps.onStatusChange).toHaveBeenCalledWith('1', 'IN_PROGRESS');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<TaskCard {...mockProps} />);
    
    const editButton = screen.getByRole('button', { name: /edit task/i });
    fireEvent.click(editButton);
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<TaskCard {...mockProps} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('displays due date correctly', () => {
    render(<TaskCard {...mockProps} />);
    
    expect(screen.getByText('12/31/2024')).toBeInTheDocument();
  });

  it('shows overdue styling for past due dates', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: '2020-01-01', // Past date
    };
    
    const { container } = render(<TaskCard {...mockProps} task={overdueTask} />);
    
    // Check if the card has overdue styling
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-red-300', 'bg-red-50');
  });

  it('handles task without assignee', () => {
    const unassignedTask = {
      ...mockTask,
      assigneeEmail: '',
    };
    
    render(<TaskCard {...mockProps} task={unassignedTask} />);
    
    // Should not show assignee section
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('handles task without comments', () => {
    const taskWithoutComments = {
      ...mockTask,
      comments: [],
    };
    
    render(<TaskCard {...mockProps} task={taskWithoutComments} />);
    
    // Should not show comment count
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});