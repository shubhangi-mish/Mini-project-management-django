import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProjectStatistics } from '../components/projects/ProjectStatistics';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { useProject } from '../hooks/useProjects';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrganization } = useOrganizationContext();
  const { project, loading, error, refetch } = useProject(projectId || '');

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout title="Project Not Found">
        <div className="text-center py-12">
          <ErrorMessage 
            message={error?.message || "Project not found"} 
            onRetry={() => refetch()}
          />
          {currentOrganization && (
            <div className="mt-6">
              <Link
                to={`/org/${currentOrganization.slug}/projects`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                ← Back to Projects
              </Link>
            </div>
          )}
        </div>
      </Layout>
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout title={project.name}>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                {project.isOverdue && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </div>
              
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(project.createdAt)}
                </div>
                {project.dueDate && (
                  <div>
                    <span className="font-medium">Due:</span> {formatDate(project.dueDate)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Tasks:</span> {project.taskCount || 0}
                </div>
                <div>
                  <span className="font-medium">Completion:</span> {Math.round((project.completionPercentage || 0) * 100)}%
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {currentOrganization && (
                <Link
                  to={`/org/${currentOrganization.slug}/projects`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Back to Projects
                </Link>
              )}
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Edit Project
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              </div>
              <div className="p-6">
                <TaskBoard project={project} />
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            <ProjectStatistics projectId={project.id} />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add New Task
                </button>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Export Tasks
                </button>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Project Settings
                </button>
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="text-sm text-gray-900">{project.organization.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">{project.status.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{formatDate(project.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{formatDate(project.updatedAt)}</dd>
                </div>
                {project.dueDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(project.dueDate)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetail;