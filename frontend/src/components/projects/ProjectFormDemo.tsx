import React, { useState, useEffect } from 'react';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

// Simplified types for demo purposes
interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number | null;
  completedTaskCount: number | null;
  completionPercentage: number | null;
  isOverdue: boolean | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProjectFormDemoProps {
  project?: ProjectType | null;
  onSuccess?: (project: ProjectType) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface FormData {
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  dueDate: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  general?: string;
}

const PROJECT_STATUS_OPTIONS: { value: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'; label: string; description: string }[] = [
  { value: 'ACTIVE', label: 'Active', description: 'Project is currently in progress' },
  { value: 'ON_HOLD', label: 'On Hold', description: 'Project is temporarily paused' },
  { value: 'COMPLETED', label: 'Completed', description: 'Project has been finished' },
];

export const ProjectFormDemo: React.FC<ProjectFormDemoProps> = ({
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock project response
      const mockProject: ProjectType = {
        id: project?.id || `project-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        dueDate: formData.dueDate || null,
        createdAt: project?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        taskCount: project?.taskCount || 0,
        completedTaskCount: project?.completedTaskCount || 0,
        completionPercentage: project?.completionPercentage || 0,
        isOverdue: false,
        organization: currentOrganization,
      };

      onSuccess?.(mockProject);
    } catch (error) {
      setErrors({ general: 'Failed to save project. Please try again.' });
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
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.name
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
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.description
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
          onChange={(e) => handleInputChange('status', e.target.value as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD')}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.status
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
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            errors.dueDate
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

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onCancel}
          />

          {/* Modal panel */}
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        {formContent}
      </div>
    </div>
  );
};