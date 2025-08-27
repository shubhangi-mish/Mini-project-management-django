import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectForm } from './ProjectForm'
import { render, checkAccessibility } from '../../test/utils'
import { createProjectMock, updateProjectMock, createProjectErrorMock, mockProjects } from '../../test/mocks'

describe('ProjectForm', () => {
  it('renders create form correctly', () => {
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    expect(screen.getByText('Create Project')).toBeInTheDocument()
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('renders edit form with initial values', () => {
    const project = mockProjects[0]
    render(
      <ProjectForm 
        mode="edit" 
        project={project}
        onSuccess={vi.fn()} 
        onCancel={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Edit Project')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Project 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test project description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update project/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    const submitButton = screen.getByRole('button', { name: /create project/i })
    expect(submitButton).toBeDisabled()
    
    // Fill in name only
    const nameInput = screen.getByLabelText('Project Name')
    await user.type(nameInput, 'Test Project')
    
    expect(submitButton).toBeEnabled()
  })

  it('validates name length', async () => {
    const user = userEvent.setup()
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    const nameInput = screen.getByLabelText('Project Name')
    
    // Test minimum length
    await user.type(nameInput, 'A')
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    
    // Test maximum length
    await user.clear(nameInput)
    await user.type(nameInput, 'A'.repeat(201))
    expect(screen.getByText('Name must be less than 200 characters')).toBeInTheDocument()
  })

  it('validates description length', async () => {
    const user = userEvent.setup()
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    const descriptionInput = screen.getByLabelText('Description')
    await user.type(descriptionInput, 'A'.repeat(1001))
    
    expect(screen.getByText('Description must be less than 1000 characters')).toBeInTheDocument()
  })

  it('validates due date is in the future', async () => {
    const user = userEvent.setup()
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    const dueDateInput = screen.getByLabelText('Due Date')
    await user.type(dueDateInput, '2020-01-01')
    
    expect(screen.getByText('Due date must be in the future')).toBeInTheDocument()
  })

  it('submits create form successfully', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    
    render(
      <ProjectForm mode="create" onSuccess={onSuccess} onCancel={vi.fn()} />,
      { mocks: [createProjectMock] }
    )
    
    // Fill in form
    await user.type(screen.getByLabelText('Project Name'), 'New Project')
    await user.type(screen.getByLabelText('Description'), 'New project description')
    await user.type(screen.getByLabelText('Due Date'), '2024-12-31')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('submits edit form successfully', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const project = mockProjects[0]
    
    render(
      <ProjectForm 
        mode="edit" 
        project={project}
        onSuccess={onSuccess} 
        onCancel={vi.fn()} 
      />,
      { mocks: [updateProjectMock] }
    )
    
    // Update name
    const nameInput = screen.getByDisplayValue('Test Project 1')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Project')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /update project/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('handles form submission errors', async () => {
    const user = userEvent.setup()
    
    render(
      <ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />,
      { mocks: [createProjectErrorMock] }
    )
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('handles cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={onCancel} />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    render(
      <ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />,
      { mocks: [createProjectMock] }
    )
    
    // Fill in form
    await user.type(screen.getByLabelText('Project Name'), 'New Project')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('is accessible', () => {
    const { container } = render(
      <ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    
    checkAccessibility(container)
    
    // Check for proper form labels
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    // Tab through form fields
    await user.tab()
    expect(screen.getByLabelText('Project Name')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText('Description')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText('Due Date')).toHaveFocus()
  })

  it('handles escape key to cancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={onCancel} />)
    
    await user.keyboard('{Escape}')
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('preserves form data when validation fails', async () => {
    const user = userEvent.setup()
    
    render(<ProjectForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />)
    
    const nameInput = screen.getByLabelText('Project Name')
    const descriptionInput = screen.getByLabelText('Description')
    
    // Fill in form with invalid data
    await user.type(nameInput, 'A')
    await user.type(descriptionInput, 'Valid description')
    
    // Validation error should appear but description should remain
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    expect(descriptionInput).toHaveValue('Valid description')
  })
})