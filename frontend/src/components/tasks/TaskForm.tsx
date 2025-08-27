import React, { useState, useEffect } from 'react';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import type {
  TaskType,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  ProjectType,
} from '../../graphql/generated/types';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '../../graphql/generated/types';

interface TaskFormProps {
  task?: TaskType | null;
  project?: ProjectType | null;
  onSuccess?: (task: TaskType) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface FormData {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeEmail: string;
  dueDate: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  assigneeEmail?: string;
  dueDate?: string;
  general?: string;
}

const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string; description: string }[] = [
  { value: 'TODO', label: 'To Do', description: 'Task has not been started yet' },
  { value: 'IN_PROGRESS', label: 'In Progress', description: 'Task is currently being worked on' },
  { value: 'DONE', label: 'Done', description: 'Task has been completed' },
];

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  project,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const { currentOrganization } = useOrganizationContext();
  const isEditing = !!task;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    assigneeEmail: task?.assigneeEmail || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL mutations
  const [createTask] = useCreateTaskMutation({
    onCompleted: (data) => {
      if (data.createTask.success && data.createTask.task) {
        onSuccess?.(data.createTask.task);
      } else if (data.createTask.errors) {
        setErrors({ general: data.createTask.errors.join(', ') });
      }
    },
    onError: (error) => {
      console.error('Create task error:', error);
      setErrors({ general: error.message });
    },
    // Optimistic response for create
    optimisticResponse: !isEditing && project ? {
      createTask: {
        __typename: 'CreateTaskPayload',
        success: true,
        errors: null,
        task: {
          __typename: 'TaskType',
          id: `temp-${Date.now()}`,
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          assigneeEmail: formData.assigneeEmail || null,
          dueDate: formData.dueDate || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOverdue: false,
          isAssigned: !!formData.assigneeEmail,
          commentCount: 0,
          comments: null,
          project: project,
        },
      },
    } : undefined,
  });

  const [updateTask] = useUpdateTaskMutation({
    onCompleted: (data) => {
      if (data.updateTask.success && data.updateTask.task) {
        onSuccess?.(data.updateTask.task);
      } else if (data.updateTask.errors) {
        setErrors({ general: data.updateTask.errors.join(', ') });
      }
    },
    onError: (error) => {
      console.error('Update task error:', error);
      setErrors({ general: error.message });
    },
    // Optimistic response for update
    optimisticResponse: isEditing ? {
      updateTask: {
        __typename: 'UpdateTaskPayload',
        success: true,
        errors: null,
        task: {
          ...task!,
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          assigneeEmail: formData.assigneeEmail || null,
          dueDate: formData.dueDate || null,
          updatedAt: new Date().toISOString(),
          isAssigned: !!formData.assigneeEmail,
        },
      },
    } : undefined,
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        assigneeEmail: task.assigneeEmail || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    }
    setErrors({});
  }, [task]);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Task title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Task title must be less than 200 characters';
    }

    // Description validation (optional but with limits)
    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Assignee email validation (optional but must be valid if provided)
    if (formData.assigneeEmail.trim()) {
      if (!isValidEmail(formData.assigneeEmail.trim())) {
        newErrors.assigneeEmail = 'Please enter a valid email address';
      }
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

    if (!project && !isEditing) {
      setErrors({ general: 'No project selected' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (isEditing) {
        const input: UpdateTaskInput = {
          id: task!.id,
          organizationSlug: currentOrganization.slug,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          assigneeEmail: formData.assigneeEmail.trim() || null,
          dueDate: formData.dueDate || null,
        };

        await updateTask({ variables: { input } });
      } else {
        const input: CreateTaskInput = {
          organizationSlug: currentOrganization.slug,
          projectId: project!.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          assigneeEmail: formData.assigneeEmail.trim() || null,
          dueDate: formData.dueDate || null,
        };

        await createTask({ variables: { input } });
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
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          status: task.status,
          assigneeEmail: task.assigneeEmail || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'TODO',
          assigneeEmail: '',
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
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditing
            ? 'Update the task details below.'
            : `Fill in the details to create a new task${project ? ` for ${project.name}` : ''}.`
          }
        </p>
      </div>

      {/* General Error */}
      {errors.general && (
        <ErrorMessage message={errors.general} />
      )}

      {/* Task Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.title
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          placeholder="Enter task title"
          disabled={isSubmitting}
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* Task Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.description
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          placeholder="Enter task description (optional)"
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

      {/* Task Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as TaskStatus)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.status
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          disabled={isSubmitting}
        >
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {TASK_STATUS_OPTIONS.find(opt => opt.value === formData.status)?.description}
        </p>
      </div>

      {/* Assignee Email */}
      <div>
        <label htmlFor="assigneeEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Assignee Email
        </label>
        <input
          type="email"
          id="assigneeEmail"
          value={formData.assigneeEmail}
          onChange={(e) => handleInputChange('assigneeEmail', e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.assigneeEmail
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          placeholder="Enter assignee email (optional)"
          disabled={isSubmitting}
        />
        {errors.assigneeEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.assigneeEmail}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Optional: Assign this task to a team member by email
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
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${errors.dueDate
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
          Optional: Set a target completion date for this task
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
          {isEditing ? 'Update Task' : 'Create Task'}
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