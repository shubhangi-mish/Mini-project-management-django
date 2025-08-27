import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import { ProjectStatistics } from './ProjectStatistics';
import { GetProjectStatisticsDocument } from '../../graphql/generated/types';
import { OrganizationProvider } from '../../contexts/OrganizationContext';

// Mock the organization context
jest.mock('../../utils/organizationContext', () => ({
  getRequiredOrganizationSlug: () => 'test-org',
}));

const mockStatistics = {
  projectId: 'project-1',
  totalTasks: 15,
  completedTasks: 6,
  inProgressTasks: 5,
  todoTasks: 4,
  completionRate: 0.4,
  assignedTasks: 12,
  unassignedTasks: 3,
  overdueTasks: 2,
  taskStatusBreakdown: {
    todoCount: 4,
    inProgressCount: 5,
    doneCount: 6,
    totalCount: 15,
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <BrowserRouter>
      <OrganizationProvider>
        {children}
      </OrganizationProvider>
    </BrowserRouter>
  </MockedProvider>
);

describe('ProjectStatistics Integration', () => {
  it('renders and displays project statistics correctly', async () => {
    render(
      <TestWrapper>
        <ProjectStatistics projectId="project-1" />
      </TestWrapper>
    );

    // Check that the component renders
    expect(screen.getByText('Project Statistics')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument(); // Total tasks
    });

    // Verify status cards
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();

    // Verify task counts
    expect(screen.getByText('6')).toBeInTheDocument(); // Completed tasks
    expect(screen.getByText('5')).toBeInTheDocument(); // In progress tasks
    expect(screen.getByText('2')).toBeInTheDocument(); // Overdue tasks

    // Verify progress bars
    expect(screen.getByText('Overall Completion')).toBeInTheDocument();
    expect(screen.getByText('6/15 (40%)')).toBeInTheDocument();

    // Verify task status breakdown
    expect(screen.getByText('Task Status Breakdown')).toBeInTheDocument();
    expect(screen.getByText('To Do (4)')).toBeInTheDocument();
    expect(screen.getByText('In Progress (5)')).toBeInTheDocument();
    expect(screen.getByText('Done (6)')).toBeInTheDocument();

    // Verify completion rate
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    // Verify additional metrics
    expect(screen.getByText('Assignment Status')).toBeInTheDocument();
    expect(screen.getByText('Task Health')).toBeInTheDocument();
  });

  it('handles responsive design classes', () => {
    const { container } = render(
      <TestWrapper>
        <ProjectStatistics projectId="project-1" className="custom-responsive-class" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-responsive-class');
    
    // Check for responsive grid classes
    const statusCards = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    expect(statusCards).toBeInTheDocument();
  });

  it('displays visual chart elements correctly', async () => {
    render(
      <TestWrapper>
        <ProjectStatistics projectId="project-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    // Check for progress bar elements
    const progressBars = document.querySelectorAll('.bg-gray-200.rounded-full.h-2');
    expect(progressBars.length).toBeGreaterThan(0);

    // Check for status breakdown chart
    const chartContainer = screen.getByText('Task Status Breakdown').closest('div');
    expect(chartContainer).toBeInTheDocument();

    // Check for color-coded elements
    const greenElements = document.querySelectorAll('.bg-green-500');
    const yellowElements = document.querySelectorAll('.bg-yellow-500');
    const grayElements = document.querySelectorAll('.bg-gray-500');
    
    expect(greenElements.length).toBeGreaterThan(0);
    expect(yellowElements.length).toBeGreaterThan(0);
    expect(grayElements.length).toBeGreaterThan(0);
  });
});