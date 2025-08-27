/**
 * Utility functions for managing organization context in Apollo Client
 */

export const ORGANIZATION_STORAGE_KEY = 'currentOrganizationSlug';

/**
 * Get the current organization slug from localStorage
 */
export const getCurrentOrganizationSlug = (): string | null => {
  return localStorage.getItem(ORGANIZATION_STORAGE_KEY);
};

/**
 * Set the current organization slug in localStorage
 */
export const setCurrentOrganizationSlug = (slug: string): void => {
  localStorage.setItem(ORGANIZATION_STORAGE_KEY, slug);
};

/**
 * Remove the current organization slug from localStorage
 */
export const clearCurrentOrganizationSlug = (): void => {
  localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
};

/**
 * Check if an organization slug is currently set
 */
export const hasCurrentOrganizationSlug = (): boolean => {
  return getCurrentOrganizationSlug() !== null;
};

/**
 * Get organization context headers for GraphQL requests
 */
export const getOrganizationHeaders = (): Record<string, string> => {
  const organizationSlug = getCurrentOrganizationSlug();
  
  return {
    'X-Organization-Slug': organizationSlug || '',
    'Content-Type': 'application/json',
  };
};

/**
 * Validate that an organization slug is set before making requests
 */
export const validateOrganizationContext = (): void => {
  if (!hasCurrentOrganizationSlug()) {
    throw new Error('No organization context set. Please select an organization first.');
  }
};

/**
 * Get organization slug with validation
 */
export const getRequiredOrganizationSlug = (): string => {
  const slug = getCurrentOrganizationSlug();
  if (!slug) {
    throw new Error('No organization context set. Please select an organization first.');
  }
  return slug;
};