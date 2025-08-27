import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectList } from './ProjectList'
import { render, checkAccessibility } from '../../test/utils'
import { getProjectsMock, getProjectsErrorMock, mockProjects } from '../../test/mocks'

describe('ProjectList', () => {
  it('renders loading state initially', () => {
    render(<ProjectList />, { mocks: [] })
    
    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
  })

  it('renders projects list when data is loaded', async () => {
    render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Project 2')).toBeInTheDocument()
    expect(screen.getByText('Test project description')).toBeInTheDocument()
    expect(screen.getByText('Another test project')).toBeInTheDocument()
  })

  it('renders error state when query fails', async () => {
    render(<ProjectList />, { mocks: [getProjectsErrorMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('renders empty state when no projects exist', async () => {
    const emptyMock = {
      ...getProjectsMock,
      result: { data: { projects: [] } }
    }
    
    render(<ProjectList />, { mocks: [emptyMock] })
    
    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument()
    })

    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument()
  })

  it('displays project status indicators correctly', async () => {
    render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    // Check for status badges
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows task statistics for each project', async () => {
    render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    // Check for task counts
    expect(screen.getByText('5 tasks')).toBeInTheDocument()
    expect(screen.getByText('2 completed')).toBeInTheDocument()
    expect(screen.getByText('3 tasks')).toBeInTheDocument()
    expect(screen.getByText('3 completed')).toBeInTheDocument()
  })

  it('handles retry button click', async () => {
    const user = userEvent.setup()
    render(<ProjectList />, { mocks: [getProjectsErrorMock] })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)
    
    // Should attempt to refetch
    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
  })

  it('is accessible', async () => {
    const { container } = render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    checkAccessibility(container)
    
    // Check for proper ARIA labels
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    const firstProject = screen.getByRole('link', { name: /test project 1/i })
    await user.tab()
    expect(firstProject).toHaveFocus()
  })

  it('displays due dates when available', async () => {
    render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Due: Dec 31, 2024')).toBeInTheDocument()
  })

  it('handles responsive layout', async () => {
    render(<ProjectList />, { mocks: [getProjectsMock] })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    const projectGrid = screen.getByRole('list')
    expect(projectGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  })
})