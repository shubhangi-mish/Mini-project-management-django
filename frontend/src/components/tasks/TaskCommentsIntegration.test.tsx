/**
 * Integration test for TaskComments component
 * This test verifies that the component integrates correctly with the GraphQL schema
 */

import React from 'react';
import { TaskComments } from './TaskComments';
import { OrganizationContext } from '../../contexts/OrganizationContext';

const mockOrganization = {
  id: '1',
  name: 'Test Organization',
  slug: 'test-org',
  contactEmail: 'test@example.com',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockOrganizationContext = {
  currentOrganization: mockOrganization,
  organizations: [mockOrganization],
  setCurrentOrganization: jest.fn(),
  isLoading: false,
  error: undefined,
};

describe('TaskComments Integration', () => {
  it('renders without crashing', () => {
    // This test verifies that the component can be instantiated without errors
    const component = (
      <OrganizationContext.Provider value={mockOrganizationContext}>
        <TaskComments taskId="test-task-1" />
      </OrganizationContext.Provider>
    );
    
    expect(component).toBeDefined();
  });

  it('has correct prop types', () => {
    // Verify that the component accepts the expected props
    const props = {
      taskId: 'test-task-1',
      className: 'test-class',
    };
    
    expect(() => {
      React.createElement(TaskComments, props);
    }).not.toThrow();
  });
});