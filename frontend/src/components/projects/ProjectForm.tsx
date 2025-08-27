import React, { useState, useEffect } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import type {
  ProjectType,
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
  CreateProjectMutation,
  UpdateProjectMutation,
  CreateProjectMutationVariables,
  UpdateProjectMutationVariables
} from '../../graphql/generated/types';
import {
  CreateProjectDocument,
  UpdateProjectDocument
} from '../../graphql/generated/types';

interface ProjectFormProps {
  project?: ProjectType | null;
  onSuccess?: (project: ProjectType) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface FormData {
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  general?: string;
}

const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string; description: string }[] = [
  { value: 'ACTIVE', label: 'Active', description: 'Project is currently in progress' },
  { value: 'ON_HOLD', label: 'On Hold', description: 'Project is temporarily paused' },
  { value: 'COMPLETED', label: 'Completed', description: 'Project has been finished' },
];

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const { currentOrganization } = useOrganizationContext();
  const isEditing = !!project;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'ACTIVE',
    dueDate: project?.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL mutations
  const [createProject] = useMutation<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, {
    onCompleted: (data) => {
      if (data.createProject.success && data.createProject.project) {
        onSuccess?.(data.createProject.project);
      }
    },
    onError: (error) => {
      console.error('Create project error:', error);
      setErrors({ general: error.message });
    },
    // Optimistic response for create
    optimisticResponse: !isEditing ? {
      createProject: {
        __typename: 'CreateProjectPayload',
        success: true,
        errors: null,
        project: {
          __typename: 'ProjectType',
          id: `temp-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          dueDate: formData.dueDate || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          taskCount: 0,
          completedTaskCount: 0,
          completionPercentage: 0,
          isOverdue: false,
          organization: currentOrganization!,
          tasks: null,
          statistics: null,
        },
      },
    } : undefined,
    // Update cache after successful creation
    update: (cache, { data }) => {
      if (data?.createProject.success && data.createProject.project && currentOrganization) {
        // Update the projects query cache
        cache.modify({
          fields: {
            projects(existingProjects = []) {
              const newProjectRef = cache.writeFragment({
                data: data.createProject.project,
                fragment: gql`
                  fragment NewProject on ProjectType {
                    id
                    name
                    description
                    status
                    dueDate
                    createdAt
                    updatedAt
                    taskCount
                    completedTaskCount
                    completionPercentage
                    isOverdue
                    organization {
                      id
                      name
                      slug
                    }
                  }
                `,
              });
              return [newProjectRef, ...existingProjects];
            },
          },
        });
      }
    },
  });

  const [updateProject] = useMutation<UpdateProjectMutation, UpdateProjectMutationVariables>(UpdateProjectDocument, {
    onCompleted: (data) => {
      if (data.updateProject.success && data.updateProject.project) {
        onSuccess?.(data.updateProject.project);
      }
    },
    onError: (error) => {
      console.error('Update project error:', error);
      setErrors({ general: error.message });
    },
    // Optimistic response for update
    optimisticResponse: isEditing ? {
      updateProject: {
        __typename: 'UpdateProjectPayload',
        success: true,
        errors: null,
        project: {
          ...project!,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          dueDate: formData.dueDate || null,
          updatedAt: new Date().toISOString(),
        },
      },
    } : undefined,
  });

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
      });
    }
    setErrors({});
  }, [project]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Project name must be less than 200 characters';
    }

    // Description validation (optional but with limits)
    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Due date validation
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) {
      setErrors({ general: 'No organization selected' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (isEditing) {
        const input: UpdateProjectInput = {
          id: project!.id,
          organizationSlug: currentOrganization.slug,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          dueDate: formData.dueDate || null,
        };

        await updateProject({ variables: { input } });
      } else {
        const input: CreateProjectInput = {
          organizationSlug: currentOrganization.slug,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          dueDate: formData.dueDate || null,
        };

        await createProject({ variables: { input } });
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form to original values
      if (project) {
        setFormData({
          name: project.name,
          description: project.description || '',
          status: project.status,
          dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          status: 'ACTIVE',
          dueDate: '',
        });
      }
      setErrors({});
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Project' : 'Create New Project'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? 'Update the project details below.'
            : 'Fill in the details to create a new project.'
          }
        </p>
      </div>

      {/* General Error */}
      {errors.general && (
        <ErrorMessage message={errors.general} />
      )}

      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`block w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-base sm:text-sm min-h-touch ${errors.name
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          placeholder="Enter project name"
          disabled={isSubmitting}
          maxLength={200}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.name.length}/200 characters
        </p>
      </div>

      {/* Project Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={`block w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-base sm:text-sm resize-y ${errors.description
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          placeholder="Enter project description (optional)"
          disabled={isSubmitting}
          maxLength={1000}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.description.length}/1000 characters
        </p>
      </div>

      {/* Project Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as ProjectStatus)}
          className={`block w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-base sm:text-sm min-h-touch ${errors.status
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          disabled={isSubmitting}
        >
          {PROJECT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {PROJECT_STATUS_OPTIONS.find(opt => opt.value === formData.status)?.description}
        </p>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          value={formData.dueDate}
          onChange={(e) => handleInputChange('dueDate', e.target.value)}
          className={`block w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 text-base sm:text-sm min-h-touch ${errors.dueDate
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          disabled={isSubmitting}
          min={new Date().toISOString().split('T')[0]}
        />
        {errors.dueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Optional: Set a target completion date for this project
        </p>
      </div>

      {/* Form Actions - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-touch"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-touch"
        >
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          {isEditing ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );

  // Render as modal or inline form
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onCancel}
          />

          {/* Modal panel - Mobile optimized */}
          <div className="inline-block w-full max-w-md sm:max-w-lg p-4 sm:p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-t-lg sm:rounded-lg">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 sm:p-6">
        {formContent}
      </div>
    </div>
  );
};