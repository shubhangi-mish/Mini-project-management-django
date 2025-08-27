import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectStatistics } from '../components/projects/ProjectStatistics';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { useProjects } from '../hooks/useProjects';
import { OrganizationTest } from '../components/organization/OrganizationTest';
import { AnimatedWrapper, StaggeredList } from '../components/common/AnimatedWrapper';
import { pageTransition } from '../utils/animations';

export const Dashboard: React.FC = () => {
  const { currentOrganization } = useOrganizationContext();
  const { projects, loading: projectsLoading } = useProjects({ limit: 3 });

  return (
    <Layout title="Dashboard">
      <motion.div 
        className="space-y-6"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <AnimatedWrapper animation="fadeInUp" delay={0.1}>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to {currentOrganization?.name}
            </h2>
            <p className="text-gray-600 mb-6">
              This is your project management dashboard. Here you can view and manage all your projects and tasks.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="bg-blue-50 rounded-lg p-4"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-blue-900">Projects</h3>
                  <p className="text-blue-700">Manage your projects</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-green-50 rounded-lg p-4"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-900">Tasks</h3>
                  <p className="text-green-700">Track your tasks</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-purple-50 rounded-lg p-4"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-purple-900">Analytics</h3>
                  <p className="text-purple-700">View project statistics</p>
                </div>
              </div>
            </motion.div>
          </div>
          </div>
        </AnimatedWrapper>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Organization Context
          </h3>
          <div className="bg-gray-50 rounded-md p-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization</dt>
                <dd className="text-sm text-gray-900">{currentOrganization?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Slug</dt>
                <dd className="text-sm text-gray-900">{currentOrganization?.slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                <dd className="text-sm text-gray-900">{currentOrganization?.contactEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">URL Path</dt>
                <dd className="text-sm text-gray-900">/org/{currentOrganization?.slug}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Recent Projects Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
            {currentOrganization && (
              <Link
                to={`/org/${currentOrganization.slug}/projects`}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View all projects →
              </Link>
            )}
          </div>
          
          {projectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading projects...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-6">
              <StaggeredList className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.slice(0, 3).map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ))}
              </StaggeredList>
              
              {/* Project Statistics for the first project */}
              {projects.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Statistics for "{projects[0].name}"
                  </h4>
                  <ProjectStatistics 
                    projectId={projects[0].id} 
                    className="bg-gray-50 rounded-lg p-4"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first project.
              </p>
              {currentOrganization && (
                <div className="mt-6">
                  <Link
                    to={`/org/${currentOrganization.slug}/projects`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Project
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatedWrapper animation="fadeInUp" delay={0.4}>
          <OrganizationTest />
        </AnimatedWrapper>
      </motion.div>
    </Layout>
  );
};