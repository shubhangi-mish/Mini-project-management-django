import React, { useState } from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { ProjectStatistics } from './ProjectStatistics';
import { GetProjectStatisticsDocument } from '../../graphql/generated/types';

// Mock data for different scenarios
const mockStatisticsData = {
  activeProject: {
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
  },
  completedProject: {
    projectId: 'project-2',
    totalTasks: 8,
    completedTasks: 8,
    inProgressTasks: 0,
    todoTasks: 0,
    completionRate: 1.0,
    assignedTasks: 8,
    unassignedTasks: 0,
    overdueTasks: 0,
    taskStatusBreakdown: {
      todoCount: 0,
      inProgressCount: 0,
      doneCount: 8,
      totalCount: 8,
    },
  },
  emptyProject: {
    projectId: 'project-3',
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
  overdueProject: {
    projectId: 'project-4',
    totalTasks: 12,
    completedTasks: 3,
    inProgressTasks: 4,
    todoTasks: 5,
    completionRate: 0.25,
    assignedTasks: 8,
    unassignedTasks: 4,
    overdueTasks: 6,
    taskStatusBreakdown: {
      todoCount: 5,
      inProgressCount: 4,
      doneCount: 3,
      totalCount: 12,
    },
  },
};

// Mock the organization context
jest.mock('../../utils/organizationContext', () => ({
  getRequiredOrganizationSlug: () => 'demo-org',
}));

const createMocks = (projectId: string, statistics: any) => [
  {
    request: {
      query: GetProjectStatisticsDocument,
      variables: {
        projectId,
        organizationSlug: 'demo-org',
      },
    },
    result: {
      data: {
        projectStatistics: statistics,
      },
    },
  },
];

const errorMocks = [
  {
    request: {
      query: GetProjectStatisticsDocument,
      variables: {
        projectId: 'error-project',
        organizationSlug: 'demo-org',
      },
    },
    error: new Error('Network error occurred'),
  },
];

const nullMocks = [
  {
    request: {
      query: GetProjectStatisticsDocument,
      variables: {
        projectId: 'null-project',
        organizationSlug: 'demo-org',
      },
    },
    result: {
      data: {
        projectStatistics: null,
      },
    },
  },
];

type DemoScenario = 'active' | 'completed' | 'empty' | 'overdue' | 'error' | 'null';

export const ProjectStatisticsDemo: React.FC = () => {
  const [scenario, setScenario] = useState<DemoScenario>('active');

  const getMocksAndProjectId = () => {
    switch (scenario) {
      case 'active':
        return {
          mocks: createMocks('project-1', mockStatisticsData.activeProject),
          projectId: 'project-1',
        };
      case 'completed':
        return {
          mocks: createMocks('project-2', mockStatisticsData.completedProject),
          projectId: 'project-2',
        };
      case 'empty':
        return {
          mocks: createMocks('project-3', mockStatisticsData.emptyProject),
          projectId: 'project-3',
        };
      case 'overdue':
        return {
          mocks: createMocks('project-4', mockStatisticsData.overdueProject),
          projectId: 'project-4',
        };
      case 'error':
        return {
          mocks: errorMocks,
          projectId: 'error-project',
        };
      case 'null':
        return {
          mocks: nullMocks,
          projectId: 'null-project',
        };
      default:
        return {
          mocks: createMocks('project-1', mockStatisticsData.activeProject),
          projectId: 'project-1',
        };
    }
  };

  const { mocks, projectId } = getMocksAndProjectId();

  const scenarios = [
    { key: 'active' as const, label: 'Active Project', description: 'Project with mixed task statuses' },
    { key: 'completed' as const, label: 'Completed Project', description: 'All tasks completed' },
    { key: 'empty' as const, label: 'Empty Project', description: 'No tasks yet' },
    { key: 'overdue' as const, label: 'Overdue Project', description: 'Many overdue tasks' },
    { key: 'error' as const, label: 'Error State', description: 'Network error' },
    { key: 'null' as const, label: 'No Data', description: 'No statistics available' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ProjectStatistics Component Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Interactive demo showcasing the ProjectStatistics component with different data scenarios.
          </p>

          {/* Scenario Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Scenario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map(({ key, label, description }) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    scenario === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600 mt-1">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Scenario Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-blue-900">
              Current Scenario: {scenarios.find(s => s.key === scenario)?.label}
            </h3>
            <p className="text-blue-700 text-sm mt-1">
              {scenarios.find(s => s.key === scenario)?.description}
            </p>
          </div>
        </div>

        {/* Component Demo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MockedProvider mocks={mocks} addTypename={false}>
            <ProjectStatistics 
              projectId={projectId}
              key={`${scenario}-${projectId}`} // Force re-render on scenario change
            />
          </MockedProvider>
        </div>

        {/* Features Showcase */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Visual Elements</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Status cards with icons and colors</li>
                <li>• Progress bars with percentages</li>
                <li>• Visual task status breakdown chart</li>
                <li>• Color-coded indicators</li>
                <li>• Responsive grid layouts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Functionality</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time updates (30s polling)</li>
                <li>• Loading states and skeletons</li>
                <li>• Error handling with retry</li>
                <li>• Mobile-responsive design</li>
                <li>• Accessibility support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Usage Example</h2>
          <pre className="text-green-400 text-sm overflow-x-auto">
            <code>{`import { ProjectStatistics } from './components/projects/ProjectStatistics';

// Basic usage
<ProjectStatistics projectId="project-123" />

// With custom styling
<ProjectStatistics 
  projectId="project-123" 
  className="my-custom-class" 
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatisticsDemo;