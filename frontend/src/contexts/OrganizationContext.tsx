import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Organization } from '../types';
import { 
  getCurrentOrganizationSlug, 
  setCurrentOrganizationSlug, 
  clearCurrentOrganizationSlug 
} from '../utils/organizationContext';
import { apolloClient } from '../utils/apolloClient';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  switchOrganization: (slug: string) => Promise<void>;
  clearOrganization: () => Promise<void>;
  hasOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

// Mock organizations - in real app this would come from GraphQL API
const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    contactEmail: 'admin@acme.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Tech Startup Inc',
    slug: 'tech-startup',
    contactEmail: 'hello@techstartup.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Creative Agency',
    slug: 'creative-agency',
    contactEmail: 'contact@creative.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations] = useState<Organization[]>(MOCK_ORGANIZATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();

  // Initialize organization from URL or localStorage
  useEffect(() => {
    const initializeOrganization = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let targetSlug: string | null = null;

        // Priority: URL param > localStorage > first available org
        if (organizationSlug) {
          targetSlug = organizationSlug;
        } else {
          targetSlug = getCurrentOrganizationSlug();
        }

        if (targetSlug) {
          const org = organizations.find(o => o.slug === targetSlug);
          if (org) {
            setCurrentOrganization(org);
            setCurrentOrganizationSlug(targetSlug);
            
            // If we got the slug from localStorage but URL doesn't match, update URL
            if (!organizationSlug || organizationSlug !== targetSlug) {
              navigate(`/org/${targetSlug}`, { replace: true });
            }
          } else {
            throw new Error(`Organization '${targetSlug}' not found`);
          }
        } else if (organizations.length > 0) {
          // Auto-select first organization if none is selected
          const firstOrg = organizations[0];
          setCurrentOrganization(firstOrg);
          setCurrentOrganizationSlug(firstOrg.slug);
          navigate(`/org/${firstOrg.slug}`, { replace: true });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize organization';
        setError(errorMessage);
        console.error('Organization initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOrganization();
  }, [organizationSlug, organizations, navigate]);

  const switchOrganization = async (slug: string): Promise<void> => {
    if (currentOrganization?.slug === slug) {
      return; // Already on this organization
    }

    setIsLoading(true);
    setError(null);

    try {
      const organization = organizations.find(org => org.slug === slug);
      if (!organization) {
        throw new Error(`Organization with slug '${slug}' not found`);
      }

      // Update state and localStorage
      setCurrentOrganization(organization);
      setCurrentOrganizationSlug(slug);

      // Clear Apollo Client cache to ensure fresh data for new organization
      await apolloClient.clearStore();

      // Navigate to the new organization
      navigate(`/org/${slug}`, { replace: true });

      console.log(`Switched to organization: ${organization.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(errorMessage);
      console.error('Error switching organization:', err);
      throw err; // Re-throw so caller can handle
    } finally {
      setIsLoading(false);
    }
  };

  const clearOrganization = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      clearCurrentOrganizationSlug();
      setCurrentOrganization(null);
      
      // Clear Apollo Client cache
      await apolloClient.clearStore();
      
      // Navigate to organization selection
      navigate('/', { replace: true });
      
      console.log('Cleared organization context');
    } catch (err) {
      console.error('Error clearing organization:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: OrganizationContextType = {
    currentOrganization,
    organizations,
    isLoading,
    error,
    switchOrganization,
    clearOrganization,
    hasOrganization: currentOrganization !== null,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizationContext = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
};