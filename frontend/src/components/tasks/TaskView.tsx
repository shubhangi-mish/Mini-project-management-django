import React, { useState } from 'react';
import type { TaskType, TaskStatus } from '../../graphql/generated/types';
import { TaskBoard } from './TaskBoard';
import { TaskList } from './TaskList';

interface TaskViewProps {
  tasks: TaskType[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: TaskType) => void;
  onDeleteTask?: (taskId: string) => void;
  onCreateTask?: () => void;
  loading?: boolean;
  projectName?: string;
}

type ViewMode = 'board' | 'list';

export const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onCreateTask,
  loading = false,
  projectName,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {projectName ? `${projectName} Tasks` : 'Tasks'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                <span>Board</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>List</span>
              </div>
            </button>
          </div>

          {/* Create Task Button */}
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Task</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Task Statistics */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">To Do</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'TODO').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Done</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'DONE').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task View */}
      <div className="min-h-96">
        {viewMode === 'board' ? (
          <TaskBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            loading={loading}
          />
        ) : (
          <TaskList
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};