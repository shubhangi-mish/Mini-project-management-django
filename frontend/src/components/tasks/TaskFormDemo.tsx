import React, { useState } from 'react';
import { TaskForm } from './TaskForm';
import { TaskBoard } from './TaskBoard';
import { TaskList } from './TaskList';
import type { TaskType, TaskStatus, ProjectType } from '../../graphql/generated/types';
import { useDeleteTaskMutation } from '../../graphql/generated/types';
import { useOrganizationContext } from '../../contexts/OrganizationContext';

// Mock data for demo
const mockProject: ProjectType = {
  __typename: 'ProjectType',
  id: '1',
  name: 'Demo Project',
  description: 'A demo project for testing task functionality',
  status: 'ACTIVE',
  dueDate: null,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  taskCount: 3,
  completedTaskCount: 1,
  completionPercentage: 33.33,
  isOverdue: false,
  organization: {
    __typename: 'OrganizationType',
    id: '1',
    name: 'Demo Organization',
    slug: 'demo-org',
    contactEmail: 'demo@example.com',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  tasks: null,
  statistics: null,
};

const mockTasks: TaskType[] = [
  {
    __typename: 'TaskType',
    id: '1',
    title: 'Design user interface',
    description: 'Create wireframes and mockups for the new feature',
    status: 'TODO',
    assigneeEmail: 'designer@example.com',
    dueDate: '2024-02-15T00:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    isOverdue: false,
    isAssigned: true,
    commentCount: 2,
    comments: null,
    project: mockProject,
  },
  {
    __typename: 'TaskType',
    id: '2',
    title: 'Implement backend API',
    description: 'Build the REST API endpoints for the new feature',
    status: 'IN_PROGRESS',
    assigneeEmail: 'developer@example.com',
    dueDate: '2024-02-20T00:00:00Z',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-10T00:00:00Z',
    isOverdue: false,
    isAssigned: true,
    commentCount: 5,
    comments: null,
    project: mockProject,
  },
  {
    __typename: 'TaskType',
    id: '3',
    title: 'Write documentation',
    description: 'Document the API endpoints and usage examples',
    status: 'DONE',
    assigneeEmail: null,
    dueDate: null,
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z',
    isOverdue: false,
    isAssigned: false,
    commentCount: 1,
    comments: null,
    project: mockProject,
  },
];

export const TaskFormDemo: React.FC = () => {
  const { currentOrganization } = useOrganizationContext();
  const [tasks, setTasks] = useState<TaskType[]>(mockTasks);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  
  const [deleteTask] = useDeleteTaskMutation();

  const handleCreateTask = (newTask: TaskType) => {
    setTasks(prev => [...prev, newTask]);
    setShowCreateForm(false);
  };

  const handleEditTask = (updatedTask: TaskType) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
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
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Management Demo</h1>
        <p className="text-gray-600 mb-6">
          This demo showcases the task creation, editing, and management functionality.
        </p>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">View:</span>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'board'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Task View */}
        {viewMode === 'board' ? (
          <TaskBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : (
          <TaskList
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {/* Create Task Modal */}
        {showCreateForm && (
          <TaskForm
            project={mockProject}
            onSuccess={handleCreateTask}
            onCancel={() => setShowCreateForm(false)}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
};