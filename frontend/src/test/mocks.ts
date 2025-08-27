import { MockedResponse } from '@apollo/client/testing'
import { 
  GetProjectsDocument, 
  GetTasksDocument, 
  CreateProjectDocument, 
  UpdateProjectDocument, 
  CreateTaskDocument, 
  UpdateTaskDocument,
  CreateTaskCommentDocument,
  GetProjectStatisticsDocument 
} from '../graphql/generated'

// Mock data
export const mockOrganization = {
  id: '1',
  name: 'Test Organization',
  slug: 'test-org',
  contactEmail: 'test@example.com'
}

export const mockProjects = [
  {
    id: '1',
    name: 'Test Project 1',
    description: 'Test project description',
    status: 'ACTIVE' as const,
    dueDate: '2024-12-31',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tasks: [],
    taskStatistics: {
      totalTasks: 5,
      completedTasks: 2,
      todoTasks: 2,
      inProgressTasks: 1,
      completionRate: 40
    }
  },
  {
    id: '2',
    name: 'Test Project 2',
    description: 'Another test project',
    status: 'COMPLETED' as const,
    dueDate: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tasks: [],
    taskStatistics: {
      totalTasks: 3,
      completedTasks: 3,
      todoTasks: 0,
      inProgressTasks: 0,
      completionRate: 100
    }
  }
]

export const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test task description',
    status: 'TODO' as const,
    assigneeEmail: 'user@example.com',
    dueDate: '2024-12-31T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    comments: []
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Another test task',
    status: 'IN_PROGRESS' as const,
    assigneeEmail: 'user2@example.com',
    dueDate: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    comments: []
  }
]

export const mockComments = [
  {
    id: '1',
    content: 'This is a test comment',
    authorEmail: 'author@example.com',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    content: 'Another test comment',
    authorEmail: 'author2@example.com',
    createdAt: '2024-01-02T00:00:00Z'
  }
]

// GraphQL mocks
export const getProjectsMock: MockedResponse = {
  request: {
    query: GetProjectsDocument,
    variables: { organizationSlug: 'test-org' }
  },
  result: {
    data: {
      projects: mockProjects
    }
  }
}

export const getTasksMock: MockedResponse = {
  request: {
    query: GetTasksDocument,
    variables: { projectId: '1', organizationSlug: 'test-org' }
  },
  result: {
    data: {
      tasks: mockTasks
    }
  }
}

export const createProjectMock: MockedResponse = {
  request: {
    query: CreateProjectDocument,
    variables: {
      input: {
        name: 'New Project',
        description: 'New project description',
        organizationSlug: 'test-org',
        dueDate: '2024-12-31'
      }
    }
  },
  result: {
    data: {
      createProject: {
        success: true,
        project: {
          ...mockProjects[0],
          id: '3',
          name: 'New Project',
          description: 'New project description'
        },
        errors: []
      }
    }
  }
}

export const updateProjectMock: MockedResponse = {
  request: {
    query: UpdateProjectDocument,
    variables: {
      input: {
        id: '1',
        name: 'Updated Project',
        organizationSlug: 'test-org'
      }
    }
  },
  result: {
    data: {
      updateProject: {
        success: true,
        project: {
          ...mockProjects[0],
          name: 'Updated Project'
        },
        errors: []
      }
    }
  }
}

export const createTaskMock: MockedResponse = {
  request: {
    query: CreateTaskDocument,
    variables: {
      input: {
        title: 'New Task',
        description: 'New task description',
        projectId: '1',
        organizationSlug: 'test-org',
        assigneeEmail: 'user@example.com'
      }
    }
  },
  result: {
    data: {
      createTask: {
        success: true,
        task: {
          ...mockTasks[0],
          id: '3',
          title: 'New Task',
          description: 'New task description'
        },
        errors: []
      }
    }
  }
}

export const updateTaskMock: MockedResponse = {
  request: {
    query: UpdateTaskDocument,
    variables: {
      input: {
        id: '1',
        status: 'IN_PROGRESS',
        organizationSlug: 'test-org'
      }
    }
  },
  result: {
    data: {
      updateTask: {
        success: true,
        task: {
          ...mockTasks[0],
          status: 'IN_PROGRESS'
        },
        errors: []
      }
    }
  }
}

export const createTaskCommentMock: MockedResponse = {
  request: {
    query: CreateTaskCommentDocument,
    variables: {
      input: {
        taskId: '1',
        content: 'New comment',
        authorEmail: 'author@example.com',
        organizationSlug: 'test-org'
      }
    }
  },
  result: {
    data: {
      createTaskComment: {
        success: true,
        comment: {
          id: '3',
          content: 'New comment',
          authorEmail: 'author@example.com',
          createdAt: '2024-01-03T00:00:00Z'
        },
        errors: []
      }
    }
  }
}

export const getProjectStatisticsMock: MockedResponse = {
  request: {
    query: GetProjectStatisticsDocument,
    variables: { projectId: '1', organizationSlug: 'test-org' }
  },
  result: {
    data: {
      projectStatistics: {
        totalTasks: 5,
        completedTasks: 2,
        todoTasks: 2,
        inProgressTasks: 1,
        completionRate: 40
      }
    }
  }
}

// Error mocks
export const getProjectsErrorMock: MockedResponse = {
  request: {
    query: GetProjectsDocument,
    variables: { organizationSlug: 'test-org' }
  },
  error: new Error('Failed to fetch projects')
}

export const createProjectErrorMock: MockedResponse = {
  request: {
    query: CreateProjectDocument,
    variables: {
      input: {
        name: '',
        description: '',
        organizationSlug: 'test-org'
      }
    }
  },
  result: {
    data: {
      createProject: {
        success: false,
        project: null,
        errors: [
          {
            field: 'name',
            message: 'Name is required'
          }
        ]
      }
    }
  }
}