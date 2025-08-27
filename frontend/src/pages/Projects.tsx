import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ProjectList } from '../components/projects';
import { ProjectForm } from '../components/projects/ProjectForm';
import { useProjects } from '../hooks/useProjects';
import type { ProjectType } from '../graphql/generated/types';

export const Projects: React.FC = () => {
  const { projects, loading, error, refetch } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleEditProject = (project: ProjectType) => {
    setEditingProject(project);
  };

  const handleDeleteProject = async (project: ProjectType) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        // TODO: Implement delete functionality when mutation is available
        console.log('Delete project:', project.id);
        // await deleteProject(project.id);
        refetch();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleProjectSuccess = (_project: ProjectType) => {
    setShowCreateModal(false);
    setEditingProject(null);
    refetch(); // Refresh the project list
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingProject(null);
  };

  return (
    <Layout title="Projects">
      <ProjectList
        projects={projects}
        loading={loading}
        error={error}
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
      />
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <ProjectForm
          isModal={true}
          onSuccess={handleProjectSuccess}
          onCancel={handleCloseModal}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          isModal={true}
          onSuccess={handleProjectSuccess}
          onCancel={handleCloseModal}
        />
      )}
    </Layout>
  );
};