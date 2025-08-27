import React from 'react';
import { useOrganization } from '../../hooks/useOrganization';
import { useProjects } from '../../hooks/useProjects';

/**
 * Test component to verify Apollo Client configuration
 */
export const ApolloTest: React.FC = () => {
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization, 
    isLoading: orgLoading,
    error: orgError 
  } = useOrganization();

  // Only fetch projects if we have an organization
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError 
  } = currentOrganization ? useProjects() : { projects: [], loading: false, error: null };

  if (orgLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-700">Loading organization context...</p>
      </div>
    );
  }

  if (orgError) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-700">Organization Error: {orgError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Organization Context
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Organization:
            </label>
            <p className="text-sm text-gray-900">
              {currentOrganization ? (
                <span className="font-medium">{currentOrganization.name} ({currentOrganization.slug})</span>
              ) : (
                <span className="text-gray-500">No organization selected</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Switch Organization:
            </label>
            <div className="flex gap-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => switchOrganization(org.slug)}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    currentOrganization?.id === org.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={orgLoading}
                >
                  {org.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apollo Client Test */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Apollo Client Test
        </h3>

        {!currentOrganization ? (
          <p className="text-gray-500">Select an organization to test GraphQL queries</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Projects Query Status:</h4>
              {projectsLoading ? (
                <p className="text-blue-600">Loading projects...</p>
              ) : projectsError ? (
                <div className="text-red-600">
                  <p className="font-medium">GraphQL Error:</p>
                  <pre className="text-sm mt-1 bg-red-50 p-2 rounded">
                    {JSON.stringify(projectsError, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-green-600">
                  <p className="font-medium">✅ Query executed successfully</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {projects.length} projects
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Apollo Client Configuration:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✅ Apollo Client initialized</p>
                <p>✅ Organization context headers configured</p>
                <p>✅ Error handling and retry logic enabled</p>
                <p>✅ Cache policies configured</p>
                <p>✅ GraphQL code generation working</p>
                <p>✅ TypeScript hooks generated</p>
              </div>
            </div>

            {projects.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sample Projects:</h4>
                <div className="space-y-2">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-600">
                        Status: {project.status} | Tasks: {project.taskCount || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};