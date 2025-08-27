import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { TaskComments } from './TaskComments';
import { GetTaskCommentsDocument, CreateTaskCommentDocument } from '../../graphql/generated/types';
import { OrganizationContext } from '../../contexts/OrganizationContext';

const mockOrganization = {
  id: '1',
  name: 'Demo Organization',
  slug: 'demo-org',
  contactEmail: 'demo@example.com',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockComments = [
  {
    id: '1',
    content: 'Great work on this task! The implementation looks solid and follows our coding standards.',
    authorEmail: 'alice.johnson@example.com',
    authorDisplayName: 'Alice Johnson',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    task: {
      id: 'demo-task-1',
      title: 'Implement user authentication',
      project: {
        id: 'demo-project-1',
        name: 'Demo Project',
        organization: {
          id: '1',
          slug: 'demo-org',
        },
      },
    },
  },
  {
    id: '2',
    content: 'I found a small issue with the validation logic. Could you please check the email format validation?',
    authorEmail: 'bob.smith@example.com',
    authorDisplayName: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    task: {
      id: 'demo-task-1',
      title: 'Implement user authentication',
      project: {
        id: 'demo-project-1',
        name: 'Demo Project',
        organization: {
          id: '1',
          slug: 'demo-org',
        },
      },
    },
  },
  {
    id: '3',
    content: 'Thanks for the feedback! I\'ve fixed the validation issue and added additional test cases to cover edge cases.',
    authorEmail: 'charlie.brown@example.com',
    authorDisplayName: 'Charlie Brown',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    task: {
      id: 'demo-task-1',
      title: 'Implement user authentication',
      project: {
        id: 'demo-project-1',
        name: 'Demo Project',
        organization: {
          id: '1',
          slug: 'demo-org',
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
        taskId: 'demo-task-1',
        organizationSlug: 'demo-org',
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
          taskId: 'demo-task-1',
          content: 'This is a new comment from the demo!',
          authorEmail: 'demo.user@example.com',
          organizationSlug: 'demo-org',
        },
      },
    },
    result: {
      data: {
        createTaskComment: {
          success: true,
          errors: null,
          comment: {
            id: '4',
            content: 'This is a new comment from the demo!',
            authorEmail: 'demo.user@example.com',
            authorDisplayName: null,
            createdAt: new Date().toISOString(),
            task: {
              id: 'demo-task-1',
              title: 'Implement user authentication',
              project: {
                id: 'demo-project-1',
                name: 'Demo Project',
                organization: {
                  id: '1',
                  slug: 'demo-org',
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
        taskId: 'empty-task',
        organizationSlug: 'demo-org',
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
  setCurrentOrganization: () => {},
  isLoading: false,
  error: undefined,
};

export const TaskCommentsDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Comments Demo</h1>
        <p className="text-lg text-gray-600">
          Interactive demonstration of the task comment system
        </p>
      </div>

      {/* Demo with existing comments */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Task with Existing Comments
        </h2>
        <p className="text-gray-600 mb-6">
          This demonstrates how comments are displayed when a task already has discussion history.
        </p>
        
        <MockedProvider mocks={mocks} addTypename={false}>
          <OrganizationContext.Provider value={mockOrganizationContext}>
            <TaskComments taskId="demo-task-1" />
          </OrganizationContext.Provider>
        </MockedProvider>
      </div>

      {/* Demo with no comments */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Task with No Comments
        </h2>
        <p className="text-gray-600 mb-6">
          This shows the empty state when a task has no comments yet.
        </p>
        
        <MockedProvider mocks={emptyMocks} addTypename={false}>
          <OrganizationContext.Provider value={mockOrganizationContext}>
            <TaskComments taskId="empty-task" />
          </OrganizationContext.Provider>
        </MockedProvider>
      </div>

      {/* Features showcase */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Features Demonstrated</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Comment Display</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Author name formatting from email</li>
              <li>• Avatar with initials</li>
              <li>• Relative timestamp formatting</li>
              <li>• Proper content formatting</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Add new comments</li>
              <li>• Form validation</li>
              <li>• Real-time cache updates</li>
              <li>• Loading and error states</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">How to Use</h2>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. <strong>View Comments:</strong> Comments are displayed in chronological order with author information and timestamps.</p>
          <p>2. <strong>Add Comments:</strong> Click "Add Comment" to open the form, enter your email and comment, then submit.</p>
          <p>3. <strong>Real-time Updates:</strong> New comments appear immediately after submission through Apollo Client cache updates.</p>
          <p>4. <strong>Author Display:</strong> Names are formatted from email addresses when display names aren't available.</p>
        </div>
      </div>
    </div>
  );
};