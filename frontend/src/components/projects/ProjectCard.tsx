import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ProjectType } from '../../graphql/generated/types';
import { hoverLift } from '../../utils/animations';

interface ProjectCardProps {
  project: ProjectType;
  onEdit?: (project: ProjectType) => void;
  onDelete?: (project: ProjectType) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    case 'ON_HOLD':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'COMPLETED':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    case 'ON_HOLD':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const completionPercentage = project.completionPercentage || 0;

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date();
  const isDueSoon = project.dueDate && 
    new Date(project.dueDate) > new Date() && 
    new Date(project.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border border-gray-200"
      {...hoverLift}
      layout
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 sm:p-6">
        {/* Header - Mobile Optimized */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <Link 
              to={`/org/${project.organization.slug}/projects/${project.id}`}
              className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 block leading-tight"
            >
              <span className="line-clamp-2">{project.name}</span>
            </Link>
            {project.description && (
              <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          
          {/* Actions Menu - Touch Optimized */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {onEdit && (
              <motion.button
                onClick={() => onEdit(project)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 min-w-touch min-h-touch rounded-md hover:bg-gray-100"
                title="Edit project"
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
                onClick={() => onDelete(project)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 min-w-touch min-h-touch rounded-md hover:bg-red-50"
                title="Delete project"
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

        {/* Status and Due Date - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusIcon(project.status)}
              <span className="ml-1 capitalize">{project.status.toLowerCase().replace('_', ' ')}</span>
            </span>
          </div>
          
          {project.dueDate && (
            <div className={`text-xs ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
              {isOverdue && (
                <div className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Overdue: {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {isDueSoon && !isOverdue && (
                <div className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {!isOverdue && !isDueSoon && (
                <div className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-medium">{completionPercentage}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Task Statistics - Mobile Optimized */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="whitespace-nowrap">{project.taskCount || 0} tasks</span>
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="whitespace-nowrap">{project.completedTaskCount || 0} done</span>
            </span>
          </div>
          
          <time className="text-xs text-gray-400 xs:text-right">
            <span className="xs:hidden">Created: </span>
            {new Date(project.createdAt).toLocaleDateString()}
          </time>
        </div>
      </div>
    </motion.div>
  );
};