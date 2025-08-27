import React from 'react';
import { useProjectStatistics } from '../../hooks/useProjectStatistics';
import { ErrorMessage } from '../common/ErrorMessage';

interface ProjectStatisticsProps {
  projectId: string;
  className?: string;
}

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, color, className = '' }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{value}/{max} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface StatusCardProps {
  title: string;
  count: number;
  color: string;
  icon: string;
  className?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, count, color, icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export const ProjectStatistics: React.FC<ProjectStatisticsProps> = ({ 
  projectId, 
  className = '' 
}) => {
  const { statistics, loading, error, refetch } = useProjectStatistics(projectId);

  if (loading && !statistics) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage 
          message="Failed to load project statistics" 
          onRetry={() => refetch()}
        />
      </div>
    );
  }


  
  if (!statistics) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No statistics available for this project.</p>
      </div>
    );
  }

  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionRate,
    assignedTasks,
    unassignedTasks,
    overdueTasks,
    taskStatusBreakdown
  } = statistics;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Project Statistics</h3>
        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Updating...
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total Tasks"
          count={totalTasks}
          color="bg-blue-100 text-blue-600"
          icon="📋"
        />
        <StatusCard
          title="Completed"
          count={completedTasks}
          color="bg-green-100 text-green-600"
          icon="✅"
        />
        <StatusCard
          title="In Progress"
          count={inProgressTasks}
          color="bg-yellow-100 text-yellow-600"
          icon="🔄"
        />
        <StatusCard
          title="Overdue"
          count={overdueTasks}
          color="bg-red-100 text-red-600"
          icon="⚠️"
        />
      </div>

      {/* Progress Bars */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h4 className="text-md font-semibold text-gray-900">Task Progress</h4>
        
        <ProgressBar
          value={completedTasks}
          max={totalTasks}
          label="Overall Completion"
          color="bg-green-500"
        />
        
        <ProgressBar
          value={inProgressTasks}
          max={totalTasks}
          label="In Progress"
          color="bg-yellow-500"
        />
        
        <ProgressBar
          value={todoTasks}
          max={totalTasks}
          label="To Do"
          color="bg-gray-500"
        />
        
        <ProgressBar
          value={assignedTasks}
          max={totalTasks}
          label="Assigned Tasks"
          color="bg-blue-500"
        />
        
        {overdueTasks > 0 && (
          <ProgressBar
            value={overdueTasks}
            max={totalTasks}
            label="Overdue Tasks"
            color="bg-red-500"
          />
        )}
      </div>

      {/* Task Status Breakdown Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Task Status Breakdown</h4>
        
        {totalTasks > 0 ? (
          <div className="space-y-4">
            {/* Visual Chart */}
            <div className="flex h-8 rounded-lg overflow-hidden">
              {taskStatusBreakdown.todoCount > 0 && (
                <div
                  className="bg-gray-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(taskStatusBreakdown.todoCount / totalTasks) * 100}%` }}
                  title={`To Do: ${taskStatusBreakdown.todoCount} tasks`}
                >
                  {taskStatusBreakdown.todoCount > 0 && taskStatusBreakdown.todoCount}
                </div>
              )}
              {taskStatusBreakdown.inProgressCount > 0 && (
                <div
                  className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(taskStatusBreakdown.inProgressCount / totalTasks) * 100}%` }}
                  title={`In Progress: ${taskStatusBreakdown.inProgressCount} tasks`}
                >
                  {taskStatusBreakdown.inProgressCount > 0 && taskStatusBreakdown.inProgressCount}
                </div>
              )}
              {taskStatusBreakdown.doneCount > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(taskStatusBreakdown.doneCount / totalTasks) * 100}%` }}
                  title={`Done: ${taskStatusBreakdown.doneCount} tasks`}
                >
                  {taskStatusBreakdown.doneCount > 0 && taskStatusBreakdown.doneCount}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
                <span>To Do ({taskStatusBreakdown.todoCount})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span>In Progress ({taskStatusBreakdown.inProgressCount})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span>Done ({taskStatusBreakdown.doneCount})</span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {Math.round(completionRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks in this project yet.</p>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Assignment Status</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Assigned</span>
              <span className="font-medium">{assignedTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Unassigned</span>
              <span className="font-medium">{unassignedTasks}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Task Health</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">On Track</span>
              <span className="font-medium text-green-600">{totalTasks - overdueTasks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overdue</span>
              <span className="font-medium text-red-600">{overdueTasks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatistics;