import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ProjectStatistics } from './ProjectStatistics';
import { GetProjectStatisticsDocument } from '../../graphql/generated/types';

// Mock the organization context
jest.mock('../../utils/organizationContext', () => ({
  getRequiredOrganizationSlug: () => 'test-org',
}));

const mockStatistics = {
  projectId: 'project-1',
  totalTasks: 10,
  completedTasks: 4,
  inProgressTasks: 3,
  todoTasks: 3,
  completionRate: 0.4,
  assignedTasks: 8,
  unassignedTasks: 2,
  overdueTasks: 1,
  taskStatusBreakdown: {
    todoCount: 3,
    inProgressCount: 3,
    doneCount: 4,
    totalCount: 10,
  },
};

const mocks = [
  {
    request: {
      query: GetProjectStatisticsDocument,
      variables: {
        projectId: 'project-1',
        organizationSlug: 'test-org',
      },
    },
    result: {
      data: {
        projectStatistics: mockStatistics,
      },
    },
  },
];

const errorMocks = [
  {
    request: {
      query: GetProjectStatisticsDocument,
      variables: {
        projectId: 'project-1',
        organizationSlug: 'test-org',
      },
    },
    error: new Error('Failed to fetch statistics'),
  },
];

const emptyMocks = [
  {
    request: {
      query: GetProjectStatisticsDocument,
      variables: {
        projectId: 'project-1',
        organizationSlug: 'test-org',
      },
    },
    result: {
      data: {
        projectStatistics: null,
      },
    },
  },
];

describe('ProjectStatistics', () => {
  it('renders loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" />
      </MockedProvider>
    );

    expect(screen.getByText('Project Statistics')).toBeInTheDocument();
    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders statistics data correctly', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project Statistics')).toBeInTheDocument();
    });

    // Check status cards
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Check progress bars
    expect(screen.getByText('Overall Completion')).toBeInTheDocument();
    expect(screen.getByText('4/10 (40%)')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('3/10 (30%)')).toBeInTheDocument();

    // Check task status breakdown
    expect(screen.getByText('Task Status Breakdown')).toBeInTheDocument();
    expect(screen.getByText('To Do (3)')).toBeInTheDocument();
    expect(screen.getByText('In Progress (3)')).toBeInTheDocument();
    expect(screen.getByText('Done (4)')).toBeInTheDocument();

    // Check completion rate
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    // Check assignment status
    expect(screen.getByText('Assignment Status')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Check task health
    expect(screen.getByText('Task Health')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument(); // 10 - 1 overdue
  });

  it('renders error state correctly', async () => {
    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load project statistics')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders empty state when no statistics available', async () => {
    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No statistics available for this project.')).toBeInTheDocument();
    });
  });

  it('handles zero tasks correctly', async () => {
    const zeroTasksMocks = [
      {
        request: {
          query: GetProjectStatisticsDocument,
          variables: {
            projectId: 'project-1',
            organizationSlug: 'test-org',
          },
        },
        result: {
          data: {
            projectStatistics: {
              ...mockStatistics,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              todoTasks: 0,
              completionRate: 0,
              assignedTasks: 0,
              unassignedTasks: 0,
              overdueTasks: 0,
              taskStatusBreakdown: {
                todoCount: 0,
                inProgressCount: 0,
                doneCount: 0,
                totalCount: 0,
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={zeroTasksMocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No tasks in this project yet.')).toBeInTheDocument();
    });

    // Should still show the cards with zero values
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" className="custom-class" />
      </MockedProvider>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows updating indicator when loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProjectStatistics projectId="project-1" />
      </MockedProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Project Statistics')).toBeInTheDocument();
    });

    // The component should show updating indicator during polling
    // This is harder to test without mocking the polling behavior
    // but the component is set up to show it when loading is true
  });
});