import type {
  CreateProjectMutationVariables,
  UpdateProjectMutationVariables,
} from '../graphql/generated/types';
import { useGetProjectsQuery, useGetProjectQuery } from '../graphql/generated/types';
import { getRequiredOrganizationSlug } from '../utils/organizationContext';

/**
 * Hook for fetching projects with organization context
 */
export const useProjects = (options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  const organizationSlug = getRequiredOrganizationSlug();
  
  const { data, loading, error, refetch } = useGetProjectsQuery({
    variables: {
      organizationSlug,
      status: options?.status,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  return {
    projects: data?.projects || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching a single project with organization context
 */
export const useProject = (projectId: string) => {
  const organizationSlug = getRequiredOrganizationSlug();
  
  const { data, loading, error, refetch } = useGetProjectQuery({
    variables: {
      id: projectId,
      organizationSlug,
    },
    errorPolicy: 'all',
    skip: !projectId,
  });

  return {
    project: data?.project,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for project mutations (create, update, delete)
 * TODO: Implement when mutation hooks are working properly
 */
export const useProjectMutations = () => {
  const organizationSlug = getRequiredOrganizationSlug();

  const createProject = async (input: Omit<CreateProjectMutationVariables['input'], 'organizationSlug'>) => {
    // TODO: Implement when mutations are available
    console.log('Create project:', { ...input, organizationSlug });
    throw new Error('Project creation not yet implemented');
  };

  const updateProject = async (input: Omit<UpdateProjectMutationVariables['input'], 'organizationSlug'>) => {
    // TODO: Implement when mutations are available
    console.log('Update project:', { ...input, organizationSlug });
    throw new Error('Project update not yet implemented');
  };

  const deleteProject = async (id: string) => {
    // TODO: Implement when mutations are available
    console.log('Delete project:', { id, organizationSlug });
    throw new Error('Project deletion not yet implemented');
  };

  return {
    createProject,
    updateProject,
    deleteProject,
    loading: false,
  };
};