import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './TaskForm'
import { render, checkAccessibility } from '../../test/utils'
import { createTaskMock, updateTaskMock, createTaskErrorMock, mockTasks } from '../../test/mocks'

describe('TaskForm', () => {
  const defaultProps = {
    projectId: '1',
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  it('renders create form correctly', () => {
    render(<TaskForm {...defaultProps} mode="create" />)
    
    expect(screen.getByText('Create Task')).toBeInTheDocument()
    expect(screen.getByLabelText('Task Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Assignee Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('renders edit form with initial values', () => {
    const task = mockTasks[0]
    render(
      <TaskForm 
        {...defaultProps}
        mode="edit" 
        task={task}
      />
    )
    
    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test task description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    expect(submitButton).toBeDisabled()
    
    // Fill in title only
    const titleInput = screen.getByLabelText('Task Title')
    await user.type(titleInput, 'Test Task')
    
    expect(submitButton).toBeEnabled()
  })

  it('validates title length', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    const titleInput = screen.getByLabelText('Task Title')
    
    // Test minimum length
    await user.type(titleInput, 'A')
    expect(screen.getByText('Title must be at least 2 characters')).toBeInTheDocument()
    
    // Test maximum length
    await user.clear(titleInput)
    await user.type(titleInput, 'A'.repeat(201))
    expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    const emailInput = screen.getByLabelText('Assignee Email')
    await user.type(emailInput, 'invalid-email')
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('validates due date is in the future', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    const dueDateInput = screen.getByLabelText('Due Date')
    await user.type(dueDateInput, '2020-01-01T10:00')
    
    expect(screen.getByText('Due date must be in the future')).toBeInTheDocument()
  })

  it('submits create form successfully', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    
    render(
      <TaskForm {...defaultProps} mode="create" onSuccess={onSuccess} />,
      { mocks: [createTaskMock] }
    )
    
    // Fill in form
    await user.type(screen.getByLabelText('Task Title'), 'New Task')
    await user.type(screen.getByLabelText('Description'), 'New task description')
    await user.type(screen.getByLabelText('Assignee Email'), 'user@example.com')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create task/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('submits edit form successfully', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const task = mockTasks[0]
    
    render(
      <TaskForm 
        {...defaultProps}
        mode="edit" 
        task={task}
        onSuccess={onSuccess}
      />,
      { mocks: [updateTaskMock] }
    )
    
    // Update title
    const titleInput = screen.getByDisplayValue('Test Task 1')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /update task/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('handles form submission errors', async () => {
    const user = userEvent.setup()
    
    render(
      <TaskForm {...defaultProps} mode="create" />,
      { mocks: [createTaskErrorMock] }
    )
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create task/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('handles cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    
    render(<TaskForm {...defaultProps} onCancel={onCancel} mode="create" />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    render(
      <TaskForm {...defaultProps} mode="create" />,
      { mocks: [createTaskMock] }
    )
    
    // Fill in form
    await user.type(screen.getByLabelText('Task Title'), 'New Task')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create task/i }))
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('handles status selection in edit mode', async () => {
    const user = userEvent.setup()
    const task = mockTasks[0]
    
    render(
      <TaskForm 
        {...defaultProps}
        mode="edit" 
        task={task}
      />
    )
    
    const statusSelect = screen.getByLabelText('Status')
    expect(statusSelect).toHaveValue('TODO')
    
    await user.selectOptions(statusSelect, 'IN_PROGRESS')
    expect(statusSelect).toHaveValue('IN_PROGRESS')
  })

  it('is accessible', () => {
    const { container } = render(<TaskForm {...defaultProps} mode="create" />)
    
    checkAccessibility(container)
    
    // Check for proper form labels
    expect(screen.getByLabelText('Task Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Assignee Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    // Tab through form fields
    await user.tab()
    expect(screen.getByLabelText('Task Title')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText('Description')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText('Assignee Email')).toHaveFocus()
  })

  it('handles escape key to cancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    
    render(<TaskForm {...defaultProps} onCancel={onCancel} mode="create" />)
    
    await user.keyboard('{Escape}')
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows character count for description', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    const descriptionInput = screen.getByLabelText('Description')
    await user.type(descriptionInput, 'Test description')
    
    expect(screen.getByText('16/1000')).toBeInTheDocument()
  })

  it('handles optional assignee field', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} mode="create" />)
    
    // Should be able to submit without assignee
    const titleInput = screen.getByLabelText('Task Title')
    await user.type(titleInput, 'Test Task')
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    expect(submitButton).toBeEnabled()
  })

  it('preserves form data when validation fails', async () => {
    const user = userEvent.setup()
    
    render(<TaskForm {...defaultProps} mode="create" />)
    
    const titleInput = screen.getByLabelText('Task Title')
    const descriptionInput = screen.getByLabelText('Description')
    
    // Fill in form with invalid data
    await user.type(titleInput, 'A')
    await user.type(descriptionInput, 'Valid description')
    
    // Validation error should appear but description should remain
    expect(screen.getByText('Title must be at least 2 characters')).toBeInTheDocument()
    expect(descriptionInput).toHaveValue('Valid description')
  })
})