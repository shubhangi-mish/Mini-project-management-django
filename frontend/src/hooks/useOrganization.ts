import { useOrganizationContext } from '../contexts/OrganizationContext';

/**
 * Hook for managing organization context
 * This is now a wrapper around the OrganizationContext for backward compatibility
 */
export const useOrganization = () => {
  return useOrganizationContext();
};