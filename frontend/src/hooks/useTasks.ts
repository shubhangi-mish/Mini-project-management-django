import { useQuery, useMutation, gql } from '@apollo/client';
import {
  GetTasksQuery,
  GetTasksQueryVariables,
  GetTaskQuery,
  GetTaskQueryVariables,
  CreateTaskMutation,
  CreateTaskMutationVariables,
  UpdateTaskMutation,
  UpdateTaskMutationVariables,
  DeleteTaskMutation,
  DeleteTaskMutationVariables,
  CreateTaskCommentMutation,
  CreateTaskCommentMutationVariables,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskCommentMutation,
} from '../graphql/generated/types';
import { getRequiredOrganizationSlug } from '../utils/organizationContext';

/**
 * Hook for fetching tasks with organization context
 */
export const useTasks = (options?: {
  projectId?: string;
  status?: string;
  assigneeEmail?: string;
  limit?: number;
  offset?: number;
}) => {
  const organizationSlug = getRequiredOrganizationSlug();
  
  const { data, loading, error, refetch } = useGetTasksQuery({
    variables: {
      organizationSlug,
      projectId: options?.projectId,
      status: options?.status,
      assigneeEmail: options?.assigneeEmail,
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  return {
    tasks: data?.tasks || [],
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching a single task with organization context
 */
export const useTask = (taskId: string) => {
  const organizationSlug = getRequiredOrganizationSlug();
  
  const { data, loading, error, refetch } = useGetTaskQuery({
    variables: {
      id: taskId,
      organizationSlug,
    },
    errorPolicy: 'all',
    skip: !taskId,
  });

  return {
    task: data?.task,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for task mutations (create, update, delete)
 */
export const useTaskMutations = () => {
  const organizationSlug = getRequiredOrganizationSlug();

  const [createTaskMutation, { loading: createLoading }] = useCreateTaskMutation({
    errorPolicy: 'all',
    update: (cache, { data }) => {
      if (data?.createTask?.success && data.createTask.task) {
        // Update the tasks cache
        cache.modify({
          fields: {
            tasks(existingTasks = []) {
              const newTaskRef = cache.writeFragment({
                data: data.createTask.task,
                fragment: gql`
                  fragment NewTask on TaskType {
                    id
                    title
                    description
                    status
                    assigneeEmail
                    dueDate
                    createdAt
                    updatedAt
                    isOverdue
                    isAssigned
                    commentCount
                  }
                `,
              });
              return [newTaskRef, ...existingTasks];
            },
          },
        });

        // Also update the project's task count if available
        if (data.createTask.task.project?.id) {
          cache.modify({
            id: cache.identify({ __typename: 'ProjectType', id: data.createTask.task.project.id }),
            fields: {
              taskCount(existingCount = 0) {
                return existingCount + 1;
              },
            },
          });
        }
      }
    },
  });

  const [updateTaskMutation, { loading: updateLoading }] = useUpdateTaskMutation({
    errorPolicy: 'all',
  });

  const [deleteTaskMutation, { loading: deleteLoading }] = useDeleteTaskMutation({
    errorPolicy: 'all',
    update: (cache, { data }, { variables }) => {
      if (data?.deleteTask?.success && variables?.input?.id) {
        // Remove from cache
        cache.evict({
          id: cache.identify({ __typename: 'TaskType', id: variables.input.id }),
        });
        cache.gc();
      }
    },
  });

  const [createCommentMutation, { loading: commentLoading }] = useCreateTaskCommentMutation({
    errorPolicy: 'all',
    update: (cache, { data }) => {
      if (data?.createTaskComment?.success && data.createTaskComment.comment) {
        // Update the task's comment count
        if (data.createTaskComment.comment.task?.id) {
          cache.modify({
            id: cache.identify({ __typename: 'TaskType', id: data.createTaskComment.comment.task.id }),
            fields: {
              commentCount(existingCount = 0) {
                return existingCount + 1;
              },
              comments(existingComments = []) {
                const newCommentRef = cache.writeFragment({
                  data: data.createTaskComment.comment,
                  fragment: gql`
                    fragment NewComment on TaskCommentType {
                      id
                      content
                      authorEmail
                      authorDisplayName
                      createdAt
                    }
                  `,
                });
                return [...existingComments, newCommentRef];
              },
            },
          });
        }
      }
    },
  });

  const createTask = async (input: Omit<CreateTaskMutationVariables['input'], 'organizationSlug'>) => {
    try {
      const result = await createTaskMutation({
        variables: {
          input: {
            ...input,
            organizationSlug,
          },
        },
      });

      if (result.data?.createTask?.success) {
        return result.data.createTask.task;
      } else {
        throw new Error(result.data?.createTask?.errors?.join(', ') || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (input: Omit<UpdateTaskMutationVariables['input'], 'organizationSlug'>) => {
    try {
      const result = await updateTaskMutation({
        variables: {
          input: {
            ...input,
            organizationSlug,
          },
        },
      });

      if (result.data?.updateTask?.success) {
        return result.data.updateTask.task;
      } else {
        throw new Error(result.data?.updateTask?.errors?.join(', ') || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const result = await deleteTaskMutation({
        variables: {
          input: {
            id,
            organizationSlug,
          },
        },
      });

      if (result.data?.deleteTask?.success) {
        return true;
      } else {
        throw new Error(result.data?.deleteTask?.errors?.join(', ') || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const createComment = async (input: Omit<CreateTaskCommentMutationVariables['input'], 'organizationSlug'>) => {
    try {
      const result = await createCommentMutation({
        variables: {
          input: {
            ...input,
            organizationSlug,
          },
        },
      });

      if (result.data?.createTaskComment?.success) {
        return result.data.createTaskComment.comment;
      } else {
        throw new Error(result.data?.createTaskComment?.errors?.join(', ') || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  return {
    createTask,
    updateTask,
    deleteTask,
    createComment,
    loading: createLoading || updateLoading || deleteLoading || commentLoading,
  };
};