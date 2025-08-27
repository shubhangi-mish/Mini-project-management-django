import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { TaskComments } from './TaskComments';
import { GetTaskCommentsDocument, CreateTaskCommentDocument } from '../../graphql/generated/types';
import { OrganizationContext } from '../../contexts/OrganizationContext';

const mockOrganization = {
  id: '1',
  name: 'Test Organization',
  slug: 'test-org',
  contactEmail: 'test@example.com',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockComments = [
  {
    id: '1',
    content: 'This is a test comment',
    authorEmail: 'john.doe@example.com',
    authorDisplayName: 'John Doe',
    createdAt: '2023-01-01T10:00:00Z',
    task: {
      id: 'task-1',
      title: 'Test Task',
      project: {
        id: 'project-1',
        name: 'Test Project',
        organization: {
          id: '1',
          slug: 'test-org',
        },
      },
    },
  },
  {
    id: '2',
    content: 'Another comment without display name',
    authorEmail: 'jane.smith@example.com',
    authorDisplayName: null,
    createdAt: '2023-01-01T11:00:00Z',
    task: {
      id: 'task-1',
      title: 'Test Task',
      project: {
        id: 'project-1',
        name: 'Test Project',
        organization: {
          id: '1',
          slug: 'test-org',
        },
      },
    },
  },
];

const mocks = [
  {
    request: {
      query: GetTaskCommentsDocument,
      variables: {
        taskId: 'task-1',
        organizationSlug: 'test-org',
      },
    },
    result: {
      data: {
        taskComments: mockComments,
      },
    },
  },
  {
    request: {
      query: CreateTaskCommentDocument,
      variables: {
        input: {
          taskId: 'task-1',
          content: 'New test comment',
          authorEmail: 'test@example.com',
          organizationSlug: 'test-org',
        },
      },
    },
    result: {
      data: {
        createTaskComment: {
          success: true,
          errors: null,
          comment: {
            id: '3',
            content: 'New test comment',
            authorEmail: 'test@example.com',
            authorDisplayName: null,
            createdAt: '2023-01-01T12:00:00Z',
            task: {
              id: 'task-1',
              title: 'Test Task',
              project: {
                id: 'project-1',
                name: 'Test Project',
                organization: {
                  id: '1',
                  slug: 'test-org',
                },
              },
            },
          },
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: GetTaskCommentsDocument,
      variables: {
        taskId: 'task-1',
        organizationSlug: 'test-org',
      },
    },
    result: {
      data: {
        taskComments: [],
      },
    },
  },
];

const mockOrganizationContext = {
  currentOrganization: mockOrganization,
  organizations: [mockOrganization],
  setCurrentOrganization: jest.fn(),
  isLoading: false,
  error: undefined,
};

const renderWithProviders = (mocks: any[], taskId = 'task-1') => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <OrganizationContext.Provider value={mockOrganizationContext}>
        <TaskComments taskId={taskId} />
      </OrganizationContext.Provider>
    </MockedProvider>
  );
};

describe('TaskComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithProviders(mocks);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders comments list when data is loaded', async () => {
    renderWithProviders(mocks);
    
    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Another comment without display name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Formatted from email
  });

  it('renders empty state when no comments exist', async () => {
    renderWithProviders(emptyMocks);
    
    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    expect(screen.getByText('No comments yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to add a comment to this task.')).toBeInTheDocument();
  });

  it('shows comment form when Add Comment button is clicked', async () => {
    renderWithProviders(emptyMocks);
    
    await waitFor(() => {
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Comment'));
    
    expect(screen.getByLabelText('Your Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add comment/i })).toBeInTheDocument();
  });

  it('allows creating a new comment', async () => {
    renderWithProviders(mocks);
    
    await waitFor(() => {
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });

    // Open comment form
    fireEvent.click(screen.getByText('Add Comment'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Comment'), {
      target: { value: 'New test comment' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add comment/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Your Email')).not.toBeInTheDocument();
    });
  });

  it('validates form fields before submission', async () => {
    renderWithProviders(emptyMocks);
    
    await waitFor(() => {
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Comment'));
    
    const submitButton = screen.getByRole('button', { name: /add comment/i });
    expect(submitButton).toBeDisabled();

    // Fill only email
    fireEvent.change(screen.getByLabelText('Your Email'), {
      target: { value: 'test@example.com' },
    });
    expect(submitButton).toBeDisabled();

    // Fill only comment
    fireEvent.change(screen.getByLabelText('Your Email'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Comment'), {
      target: { value: 'Test comment' },
    });
    expect(submitButton).toBeDisabled();

    // Fill both fields
    fireEvent.change(screen.getByLabelText('Your Email'), {
      target: { value: 'test@example.com' },
    });
    expect(submitButton).toBeEnabled();
  });

  it('formats timestamps correctly', async () => {
    renderWithProviders(mocks);
    
    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    // Check that timestamps are displayed (exact format depends on current time)
    const timeElements = screen.getAllByRole('time');
    expect(timeElements).toHaveLength(2);
    expect(timeElements[0]).toHaveAttribute('datetime', '2023-01-01T10:00:00Z');
    expect(timeElements[1]).toHaveAttribute('datetime', '2023-01-01T11:00:00Z');
  });

  it('displays author initials correctly', async () => {
    renderWithProviders(mocks);
    
    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    // Check for initials in avatar circles
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
    expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
  });

  it('handles cancel button in comment form', async () => {
    renderWithProviders(emptyMocks);
    
    await waitFor(() => {
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Comment'));
    expect(screen.getByLabelText('Your Email')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByLabelText('Your Email')).not.toBeInTheDocument();
  });

  it('shows message when no organization is selected', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <OrganizationContext.Provider value={{
          ...mockOrganizationContext,
          currentOrganization: undefined,
        }}>
          <TaskComments taskId="task-1" />
        </OrganizationContext.Provider>
      </MockedProvider>
    );

    expect(screen.getByText('Please select an organization to view comments.')).toBeInTheDocument();
  });
});