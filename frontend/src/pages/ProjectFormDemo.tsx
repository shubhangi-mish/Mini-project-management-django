import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ProjectFormDemo } from '../components/projects/ProjectFormDemo';

// Mock project for editing demo
const mockProject = {
  id: '1',
  name: 'Sample Project',
  description: 'This is a sample project for demonstration purposes.',
  status: 'ACTIVE' as const,
  dueDate: '2024-12-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  taskCount: 5,
  completedTaskCount: 2,
  completionPercentage: 40,
  isOverdue: false,
  organization: {
    id: '1',
    name: 'Demo Organization',
    slug: 'demo-org',
  },
};

export const ProjectFormDemoPage: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'edit' | 'modal-create' | 'modal-edit'>('create');
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = (project: any) => {
    console.log('Project saved:', project);
    alert(`Project "${project.name}" saved successfully!`);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <Layout title="Project Form Demo">
      <div className="space-y-8">
        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Project Form Demo
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            This demonstrates the ProjectForm component with different modes and configurations.
            The form includes validation, optimistic updates, and both inline and modal presentations.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setMode('create')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                mode === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Create Form
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                mode === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Edit Form
            </button>
            <button
              onClick={() => {
                setMode('modal-create');
                setShowModal(true);
              }}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              Create Modal
            </button>
            <button
              onClick={() => {
                setMode('modal-edit');
                setShowModal(true);
              }}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              Edit Modal
            </button>
          </div>
        </div>

        {/* Form Features */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">
            Implemented Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Form Validation</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Required field validation (project name)</li>
                <li>• Length validation (3-200 characters for name)</li>
                <li>• Description length limit (1000 characters)</li>
                <li>• Due date validation (no past dates)</li>
                <li>• Real-time character counters</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">User Experience</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Controlled form inputs</li>
                <li>• Loading states during submission</li>
                <li>• Error message display</li>
                <li>• Form reset on cancel</li>
                <li>• Modal and inline presentations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">GraphQL Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create and update mutations</li>
                <li>• Optimistic updates</li>
                <li>• Cache management</li>
                <li>• Organization context validation</li>
                <li>• Error handling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Accessibility</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Proper form labels</li>
                <li>• ARIA attributes</li>
                <li>• Keyboard navigation</li>
                <li>• Focus management</li>
                <li>• Screen reader support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form Display */}
        {!showModal && (
          <div>
            {mode === 'create' && (
              <ProjectFormDemo
                onSuccess={handleSuccess}
              />
            )}
            {mode === 'edit' && (
              <ProjectFormDemo
                project={mockProject}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        )}

        {/* Modal Forms */}
        {showModal && mode === 'modal-create' && (
          <ProjectFormDemo
            isModal={true}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}

        {showModal && mode === 'modal-edit' && (
          <ProjectFormDemo
            project={mockProject}
            isModal={true}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </Layout>
  );
};