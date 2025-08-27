/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { TaskView } from '../components/tasks';
import { TaskForm } from '../components/tasks/TaskForm';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { useTasks } from '../hooks/useTasks';
import type { TaskType, TaskStatus, ProjectType } from '../graphql/generated/types';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../graphql/generated/types';

export const Tasks: React.FC = () => {
  const { currentOrganization } = useOrganizationContext();
  const { tasks, loading, error, refetch } = useTasks();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null);

  const [updateTask] = useUpdateTaskMutation({
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
    },
  });

  const [deleteTask] = useDeleteTaskMutation({
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
    },
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!currentOrganization) return;
    
    setIsUpdating(true);
    try {
      await updateTask({
        variables: {
          input: {
            id: taskId,
            organizationSlug: currentOrganization.slug,
            status: newStatus,
          }
        }
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditTask = (task: TaskType) => {
    // Task editing is handled by the TaskDetail modal in TaskCard/TaskList components
    console.log('Edit task:', task);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentOrganization) return;
    
    try {
      await deleteTask({
        variables: {
          input: {
            id: taskId,
            organizationSlug: currentOrganization.slug,
          }
        }
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateTask = () => {
    // For now, we'll use a default project or let user select
    // In a real app, this would come from the current project context
    if (tasks.length > 0) {
      setSelectedProject(tasks[0].project);
    }
    setShowCreateForm(true);
  };

  const handleTaskCreated = (_newTask: TaskType) => {
    setShowCreateForm(false);
    refetch();
  };

  if (error) {
    return (
      <Layout title="Tasks">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.toString()}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => refetch()}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tasks">
      <TaskView
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onCreateTask={handleCreateTask}
        loading={loading || isUpdating}
      />

      {/* Create Task Modal */}
      {showCreateForm && selectedProject && (
        <TaskForm
          project={selectedProject}
          onSuccess={handleTaskCreated}
          onCancel={() => setShowCreateForm(false)}
          isModal={true}
        />
      )}
    </Layout>
  );
};