import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskType, TaskStatus } from '../../graphql/generated/types';
import { TaskDetail } from './TaskDetail';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { hoverLift, statusChangeVariants, fadeIn } from '../../utils/animations';

interface TaskCardProps {
  task: TaskType;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: TaskType) => void;
  onDelete?: (taskId: string) => void;
  isDragging?: boolean;
  className?: string;
}

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800 border-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  DONE: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isDragging = false,
  className = '',
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  const handleStatusClick = async (newStatus: TaskStatus) => {
    if (onStatusChange && newStatus !== task.status) {
      setIsStatusChanging(true);
      try {
        await onStatusChange(task.id, newStatus);
      } finally {
        setIsStatusChanging(false);
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open detail if clicking on buttons or status badges
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setShowDetail(true);
  };

  const handleEdit = (updatedTask: TaskType) => {
    onEdit?.(updatedTask);
    setShowDetail(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.(task.id);
    setShowDeleteConfirm(false);
    setShowDetail(false);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <>
      <motion.div
        onClick={handleCardClick}
        className={`
          bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm cursor-pointer
          ${isDragging ? 'opacity-50 rotate-2' : ''}
          ${isOverdue ? 'border-red-300 bg-red-50' : ''}
          ${className}
        `}
        variants={isStatusChanging ? statusChangeVariants : undefined}
        animate={isStatusChanging ? 'animate' : undefined}
        {...hoverLift}
        layout
        transition={{ duration: 0.2 }}
      >
      {/* Task Header - Mobile Optimized */}
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 pr-2 flex-1">
          {task.title}
        </h3>
        <div className="flex space-x-1 flex-shrink-0">
          {onEdit && (
            <motion.button
              onClick={() => onEdit(task)}
              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-1 transition-colors duration-200 min-w-touch min-h-touch rounded-md hover:bg-gray-100"
              title="Edit task"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600 p-1.5 sm:p-1 transition-colors duration-200 min-w-touch min-h-touch rounded-md hover:bg-red-50"
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

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 sm:mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Status Badge - Mobile Optimized */}
      <div className="mb-2 sm:mb-3">
        <div className="flex flex-wrap gap-1">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((status) => (
            <motion.button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={`
                px-2 py-1.5 sm:py-1 text-xs font-medium rounded-full border transition-colors min-h-touch
                ${task.status === status 
                  ? statusColors[status]
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }
              `}
              title={`Change status to ${statusLabels[status]}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={task.status === status ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <span className="sm:hidden">
                {status === 'TODO' ? 'To Do' : status === 'IN_PROGRESS' ? 'Progress' : 'Done'}
              </span>
              <span className="hidden sm:inline">
                {statusLabels[status]}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Assignee and Due Date - Mobile Optimized */}
      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 xs:gap-2 text-xs text-gray-500">
        <div className="flex items-center space-x-2 min-w-0">
          {task.assigneeEmail && (
            <div className="flex items-center space-x-1 min-w-0">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate max-w-16 sm:max-w-20" title={task.assigneeEmail}>
                {task.assigneeEmail.split('@')[0]}
              </span>
            </div>
          )}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
        
        {task.dueDate && (
          <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''} xs:flex-shrink-0`}>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="whitespace-nowrap">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      </motion.div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <TaskDetail
            task={task}
            onClose={() => setShowDetail(false)}
            onEdit={handleEdit}
            onDelete={onDelete ? handleDelete : undefined}
            onStatusChange={onStatusChange}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
};