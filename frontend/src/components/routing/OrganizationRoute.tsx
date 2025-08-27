import React, { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useOrganizationContext } from '../../contexts/OrganizationContext';

interface OrganizationRouteProps {
  children: ReactNode;
}

/**
 * Route guard that ensures organization context is available
 * Redirects to organization selection if no valid organization is found
 */
export const OrganizationRoute: React.FC<OrganizationRouteProps> = ({ children }) => {
  const { currentOrganization, organizations, isLoading, error } = useOrganizationContext();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error and no current organization
  if (error && !currentOrganization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Organization Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Select Organization
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validate organization slug from URL
  if (organizationSlug && currentOrganization) {
    const isValidSlug = organizations.some(org => org.slug === organizationSlug);
    const isCurrentSlug = currentOrganization.slug === organizationSlug;

    if (!isValidSlug) {
      // Invalid organization slug in URL
      return <Navigate to="/" replace />;
    }

    if (!isCurrentSlug) {
      // URL slug doesn't match current organization - let context handle the switch
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Switching organization...</p>
          </div>
        </div>
      );
    }
  }

  // No organization selected - redirect to selection
  if (!currentOrganization) {
    return <Navigate to="/" replace />;
  }

  // All good - render children
  return <>{children}</>;
};