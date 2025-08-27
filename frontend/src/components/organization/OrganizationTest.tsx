import React from 'react';
import { useOrganizationContext } from '../../contexts/OrganizationContext';

export const OrganizationTest: React.FC = () => {
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization, 
    isLoading, 
    error 
  } = useOrganizationContext();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Organization Context Test
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-700">Current Organization:</h4>
          {currentOrganization ? (
            <div className="bg-green-50 p-3 rounded-md">
              <p><strong>Name:</strong> {currentOrganization.name}</p>
              <p><strong>Slug:</strong> {currentOrganization.slug}</p>
              <p><strong>Email:</strong> {currentOrganization.contactEmail}</p>
            </div>
          ) : (
            <p className="text-gray-500">No organization selected</p>
          )}
        </div>

        <div>
          <h4 className="font-medium text-gray-700">Available Organizations:</h4>
          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => switchOrganization(org.slug)}
                disabled={isLoading || currentOrganization?.slug === org.slug}
                className={`block w-full text-left p-2 rounded border ${
                  currentOrganization?.slug === org.slug
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                {org.name} ({org.slug})
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-700">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};