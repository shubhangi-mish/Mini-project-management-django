import React, { useState } from 'react';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { Organization } from '../../types';

interface OrganizationSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization, 
    isLoading, 
    error 
  } = useOrganizationContext();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleOrganizationSwitch = async (org: Organization) => {
    if (org.slug === currentOrganization?.slug) {
      setIsDropdownOpen(false);
      return;
    }

    setSwitchingTo(org.slug);
    try {
      await switchOrganization(org.slug);
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Failed to switch organization:', err);
    } finally {
      setSwitchingTo(null);
    }
  };

  if (organizations.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No organizations available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-8 py-2.5 sm:py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
        >
          <span className="block truncate">
            {currentOrganization ? currentOrganization.name : 'Select organization...'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSwitch(org)}
                disabled={switchingTo === org.slug}
                className={`w-full text-left px-4 py-3 sm:py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-touch ${
                  currentOrganization?.slug === org.slug
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-medium truncate">{org.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">{org.contactEmail}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {currentOrganization?.slug === org.slug && (
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {switchingTo === org.slug && (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};