import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentOrganizationSlug, 
  setCurrentOrganizationSlug, 
  clearCurrentOrganizationSlug,
  hasCurrentOrganizationSlug 
} from '../utils/organizationContext';
import { apolloClient } from '../utils/apolloClient';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
}

/**
 * Hook for managing organization context
 */
export const useOrganization = () => {
  const [currentOrganizationSlug, setCurrentSlug] = useState<string | null>(
    getCurrentOrganizationSlug()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock organizations for development - in real app this would come from API
  const [organizations] = useState<Organization[]>([
    {
      id: '1',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      contactEmail: 'admin@acme.com',
    },
    {
      id: '2',
      name: 'Tech Startup Inc',
      slug: 'tech-startup',
      contactEmail: 'hello@techstartup.com',
    },
  ]);

  const currentOrganization = organizations.find(
    org => org.slug === currentOrganizationSlug
  );

  const switchOrganization = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate that the organization exists
      const organization = organizations.find(org => org.slug === slug);
      if (!organization) {
        throw new Error(`Organization with slug '${slug}' not found`);
      }

      // Update localStorage
      setCurrentOrganizationSlug(slug);
      setCurrentSlug(slug);

      // Clear Apollo Client cache to ensure fresh data for new organization
      await apolloClient.clearStore();

      console.log(`Switched to organization: ${organization.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(errorMessage);
      console.error('Error switching organization:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizations]);

  const clearOrganization = useCallback(async () => {
    setIsLoading(true);
    
    try {
      clearCurrentOrganizationSlug();
      setCurrentSlug(null);
      
      // Clear Apollo Client cache
      await apolloClient.clearStore();
      
      console.log('Cleared organization context');
    } catch (err) {
      console.error('Error clearing organization:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize organization context on mount
  useEffect(() => {
    if (!hasCurrentOrganizationSlug() && organizations.length > 0) {
      // Auto-select first organization if none is selected
      switchOrganization(organizations[0].slug);
    }
  }, [organizations, switchOrganization]);

  return {
    currentOrganization,
    currentOrganizationSlug,
    organizations,
    switchOrganization,
    clearOrganization,
    isLoading,
    error,
    hasOrganization: hasCurrentOrganizationSlug(),
  };
};