import React from 'react';
import type { TaskType, TaskStatus } from '../../graphql/generated/types';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: TaskType[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: TaskType) => void;
  onDeleteTask?: (taskId: string) => void;
  loading?: boolean;
}

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'bg-gray-50 border-gray-200' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
  { status: 'DONE', label: 'Done', color: 'bg-green-50 border-green-200' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  loading = false,
}) => {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map((column) => (
          <div key={column.status} className={`rounded-lg border-2 border-dashed p-4 ${column.color}`}>
            <h3 className="font-medium text-gray-900 mb-4">{column.label}</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        
        return (
          <div key={column.status} className={`rounded-lg border-2 border-dashed p-3 sm:p-4 min-h-64 sm:min-h-96 ${column.color}`}>
            {/* Column Header - Mobile Optimized */}
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">{column.label}</h3>
              <span className="bg-white text-gray-600 text-xs font-medium px-2 py-1 rounded-full min-w-6 text-center">
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks - Mobile Optimized */}
            <div className="space-y-2 sm:space-y-3">
              {columnTasks.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <svg
                    className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">No tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))
              )}
            </div>

            {/* Drop Zone Indicator (for future drag-and-drop) - Hidden on mobile */}
            <div className="hidden sm:block mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500 opacity-0 hover:opacity-100 transition-opacity">
              Drop tasks here
            </div>
          </div>
        );
      })}
    </div>
  );
};