import { useQuery, useMutation, gql } from '@apollo/client';
import {
  GetProjectsQuery,
  GetProjectsQueryVariables,
  GetProjectQuery,
  GetProjectQueryVariables,
  CreateProjectMutation,
  CreateProjectMutationVariables,
  UpdateProjectMutation,
  UpdateProjectMutationVariables,
  DeleteProjectMutation,
  DeleteProjectMutationVariables,
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '../graphql/generated/types';
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
 */
export const useProjectMutations = () => {
  const organizationSlug = getRequiredOrganizationSlug();

  const [createProjectMutation, { loading: createLoading }] = useCreateProjectMutation({
    errorPolicy: 'all',
    update: (cache, { data }) => {
      if (data?.createProject?.success && data.createProject.project) {
        // Update the projects cache
        cache.modify({
          fields: {
            projects(existingProjects = []) {
              const newProjectRef = cache.writeFragment({
                data: data.createProject.project,
                fragment: gql`
                  fragment NewProject on ProjectType {
                    id
                    name
                    description
                    status
                    dueDate
                    createdAt
                    updatedAt
                    taskCount
                    completedTaskCount
                    completionPercentage
                    isOverdue
                  }
                `,
              });
              return [newProjectRef, ...existingProjects];
            },
          },
        });
      }
    },
  });

  const [updateProjectMutation, { loading: updateLoading }] = useUpdateProjectMutation({
    errorPolicy: 'all',
  });

  const [deleteProjectMutation, { loading: deleteLoading }] = useDeleteProjectMutation({
    errorPolicy: 'all',
    update: (cache, { data }, { variables }) => {
      if (data?.deleteProject?.success && variables?.input?.id) {
        // Remove from cache
        cache.evict({
          id: cache.identify({ __typename: 'ProjectType', id: variables.input.id }),
        });
        cache.gc();
      }
    },
  });

  const createProject = async (input: Omit<CreateProjectMutationVariables['input'], 'organizationSlug'>) => {
    try {
      const result = await createProjectMutation({
        variables: {
          input: {
            ...input,
            organizationSlug,
          },
        },
      });

      if (result.data?.createProject?.success) {
        return result.data.createProject.project;
      } else {
        throw new Error(result.data?.createProject?.errors?.join(', ') || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (input: Omit<UpdateProjectMutationVariables['input'], 'organizationSlug'>) => {
    try {
      const result = await updateProjectMutation({
        variables: {
          input: {
            ...input,
            organizationSlug,
          },
        },
      });

      if (result.data?.updateProject?.success) {
        return result.data.updateProject.project;
      } else {
        throw new Error(result.data?.updateProject?.errors?.join(', ') || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const result = await deleteProjectMutation({
        variables: {
          input: {
            id,
            organizationSlug,
          },
        },
      });

      if (result.data?.deleteProject?.success) {
        return true;
      } else {
        throw new Error(result.data?.deleteProject?.errors?.join(', ') || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  return {
    createProject,
    updateProject,
    deleteProject,
    loading: createLoading || updateLoading || deleteLoading,
  };
};