import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskType, TaskStatus } from '../../graphql/generated/types';
import { TaskDetail } from './TaskDetail';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StaggeredList } from '../common/AnimatedWrapper';
import { staggerItem } from '../../utils/animations';

interface TaskListProps {
  tasks: TaskType[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: TaskType) => void;
  onDeleteTask?: (taskId: string) => void;
  loading?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  loading = false,
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskType | null>(null);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  const handleTaskClick = (task: TaskType) => {
    setSelectedTask(task);
  };

  const handleEditTask = (updatedTask: TaskType) => {
    onEditTask?.(updatedTask);
    setSelectedTask(null);
  };

  const handleDeleteClick = (task: TaskType, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(task);
  };

  const confirmDelete = () => {
    if (taskToDelete && onDeleteTask) {
      onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="ml-4">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new task.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-1">Comments</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Task Rows */}
      <motion.div 
        className="divide-y divide-gray-200"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {tasks.map((task) => {
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
          
          return (
            <motion.div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                isOverdue ? 'bg-red-50 border-l-4 border-red-400' : ''
              }`}
              variants={staggerItem}
              whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Task Title and Description */}
                <div className="col-span-4">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className={`
                      text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500
                      ${statusColors[task.status]}
                    `}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div className="col-span-2">
                  {task.assigneeEmail ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {task.assigneeEmail.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 truncate" title={task.assigneeEmail}>
                        {task.assigneeEmail.split('@')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </div>

                {/* Due Date */}
                <div className="col-span-2">
                  {task.dueDate ? (
                    <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </div>

                {/* Comments Count */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {task.commentCount || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex space-x-1">
                    {onEditTask && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="View/Edit task"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </motion.button>
                    )}
                    {onDeleteTask && (
                      <motion.button
                        onClick={(e) => handleDeleteClick(task, e)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete task"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={handleEditTask}
            onDelete={onDeleteTask ? () => setTaskToDelete(selectedTask) : undefined}
            onStatusChange={onStatusChange}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
        variant="danger"
      />
    </div>
  );
};